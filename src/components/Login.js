import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import '../global.css'

// Substitua pelas senhas reais quando tiver backend
const SENHA_ADMIN = 'admin123'
const SENHA_SV    = 'sv123'

export function Login() {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const entrar = async (e) => {
    e.preventDefault()
    setErro('')
    if (!usuario.trim() || !senha.trim()) { setErro('Preencha todos os campos.'); return }

    setCarregando(true)
    try {
      const response = await api.post('/auth/login', {
        email: usuario.trim(),
        senha: senha.trim()
      })
      const { token, tipo } = response
      if (tipo === 'ADMIN') {
        localStorage.setItem('tokenAdmin', token)
        localStorage.setItem('tipoUsuario', 'admin')
        localStorage.setItem('nomeUsuario', usuario)
        navigate('/admin')
      } else {
        localStorage.setItem('token', token)
        localStorage.setItem('tipoUsuario', 'salvavidas')
        localStorage.setItem('nomeUsuario', usuario)
        navigate('/dashboard')
      }
    } catch (err) {
      setErro(err.message || 'Usuário ou senha incorretos.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div style={s.wrap}>
      <div style={s.box}>

        {/* Cabeçalho institucional */}
        <div style={s.header}>
          <div style={s.headerStripe} />
          <div style={s.headerBody}>
            <div style={s.escudo}>⚑</div>
            <div>
              <p style={s.headerTop}>Corpo de Bombeiros Militar</p>
              <p style={s.headerTitle}>SANTA CATARINA</p>
              <p style={s.headerSub}>Sistema de Controle de Salva-vidas</p>
            </div>
          </div>
        </div>

        <form onSubmit={entrar} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Usuário</label>
            <input
              className="input"
              type="text"
              placeholder="seu.usuario"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              required
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Senha</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
            />
          </div>

          {erro && <p style={s.erro}>{erro}</p>}

          <button
            type="submit"
            className="btn btn-gold btn-full"
            style={{ marginTop: '4px', fontSize: '14px', letterSpacing: '2px' }}
            disabled={carregando}
          >
            {carregando ? 'Verificando...' : 'Acessar Sistema'}
          </button>
        </form>

        <p style={s.footer}>CBMSC · Uso exclusivo de servidores autorizados</p>
      </div>
    </div>
  )
  
}



const s = {
  wrap: { minHeight: '100vh', background: '#0a1828', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' },
  box: { width: '100%', maxWidth: '400px', background: '#112a4d', border: '1px solid #1a3358', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,.5)' },
  header: { background: '#0d2340', borderBottom: '3px solid #c9a84c' },
  headerStripe: { height: '4px', background: 'linear-gradient(90deg, #c9a84c, #e8c96a, #c9a84c)' },
  headerBody: { display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 24px' },
  escudo: { fontSize: '36px', color: '#c9a84c', flexShrink: 0 },
  headerTop: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '2px', color: '#6a8aaa', textTransform: 'uppercase', marginBottom: '2px' },
  headerTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 700, letterSpacing: '3px', color: '#c9a84c', lineHeight: 1 },
  headerSub: { fontFamily: "'Barlow', sans-serif", fontSize: '11px', color: '#6a8aaa', marginTop: '4px' },
  form: { display: 'flex', flexDirection: 'column', gap: '14px', padding: '24px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#6a8aaa' },
  erro: { background: '#3a1010', border: '1px solid #5a1a1a', borderRadius: '6px', padding: '10px 14px', color: '#e05252', fontFamily: "'Barlow', sans-serif", fontSize: '13px' },
  footer: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '10px', color: '#2a4a72', letterSpacing: '1px', textAlign: 'center', padding: '12px', borderTop: '1px solid #1a3358' },
}