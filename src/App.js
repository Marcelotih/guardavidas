import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Menu } from './components/Menu'
import { Login } from './components/Login'
import { Dashboard } from './components/Dashboard'
import { Inicio } from './components/Inicio'
import { CheckIn } from './components/CheckIn'
import { CheckOut } from './components/CheckOut'
import { AdminDashboard } from './components/AdminDashboard'

function App() {
  return (
    <BrowserRouter>
      <Menu />
      <Routes>
        {/* Salva-vidas */}
        <Route path='/' element={<Inicio />} />
        <Route path='/login' element={<Login />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/checkin' element={<CheckIn />} />
        <Route path='/checkout' element={<CheckOut />} />

        {/* Admin */}
        <Route path='/admin' element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;