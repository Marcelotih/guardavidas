import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../global.css'

export function Login() {
  const navigate = useNavigate()
  const [tipo, setTipo] = useState('salvavidas')
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')

  const entrar = (e) => {
    e.preventDefault()
    setErro('')
    if (!usuario.trim() || !senha.trim()) { setErro('Preencha todos os campos.'); return }

    // Substitua pela sua API real
    if (tipo === 'admin') {
      localStorage.setItem('tokenAdmin', `admin_${Date.now()}`)
      localStorage.setItem('tipoUsuario', 'admin')
      localStorage.setItem('nomeUsuario', usuario)
      navigate('/admin')
    } else {
      localStorage.setItem('token', `sv_${Date.now()}`)
      localStorage.setItem('tipoUsuario', 'salvavidas')
      localStorage.setItem('nomeUsuario', usuario)
      navigate('/dashboard')
    }
  }

  const isAdmin = tipo === 'admin'

  return (
    <div style={s.wrap}>
      <div style={s.box}>
        {/* Brand */}
        <div style={s.brand}>
          <span style={s.brandIcon}>⚑</span>
          <div>
            <div style={s.brandTitle}>SALVA-VIDAS SC</div>
            <div style={s.brandSub}>Sistema de controle de ponto</div>
          </div>
        </div>

        {/* Toggle */}
        <div style={s.toggle}>
          {['salvavidas', 'admin'].map(t => (
            <button key={t} type="button" onClick={() => { setTipo(t); setErro('') }}
              style={{ ...s.toggleBtn, ...(tipo === t ? (t === 'admin' ? s.toggleAdmin : s.toggleSV) : {}) }}>
              {t === 'admin' ? 'Tenente / Admin' : 'Salva-vidas'}
            </button>
          ))}
        </div>

        <form onSubmit={entrar} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Usuário</label>
            <input className="input" type="text" placeholder="seu.usuario" value={usuario}
              onChange={e => setUsuario(e.target.value)} required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Senha</label>
            <input className="input" type="password" placeholder="••••••••" value={senha}
              onChange={e => setSenha(e.target.value)} required />
          </div>
          {erro && <p style={s.erro}>{erro}</p>}
          <button type="submit" className={`btn btn-full ${isAdmin ? 'btn-amber' : 'btn-green'}`}>
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}

const s = {
  wrap: { minHeight: '100vh', background: '#0a0f0d', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' },
  box: { width: '100%', maxWidth: '400px', background: '#111a15', border: '1px solid #1e3020', borderRadius: '12px', padding: '32px' },
  brand: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px' },
  brandIcon: { fontSize: '32px', lineHeight: 1 },
  brandTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: '20px', letterSpacing: '3px', color: '#39e07a' },
  brandSub: { fontFamily: "'Barlow', sans-serif", fontSize: '12px', color: '#4a6650', marginTop: '2px' },
  toggle: { display: 'flex', background: '#0a0f0d', borderRadius: '8px', padding: '4px', gap: '4px', marginBottom: '24px' },
  toggleBtn: { flex: 1, padding: '9px 6px', border: 'none', borderRadius: '6px', background: 'transparent', color: '#4a6650', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all .15s' },
  toggleSV: { background: '#111a15', color: '#39e07a', boxShadow: '0 1px 4px rgba(0,0,0,.4)' },
  toggleAdmin: { background: '#111a15', color: '#f5a623', boxShadow: '0 1px 4px rgba(0,0,0,.4)' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6650' },
  erro: { background: '#2e0d0d', border: '1px solid #5a1a1a', borderRadius: '6px', padding: '10px 14px', color: '#e05252', fontFamily: "'Barlow', sans-serif", fontSize: '13px' },
}