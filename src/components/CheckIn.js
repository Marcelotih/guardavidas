import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { POSTOS } from '../postos'
import '../global.css'

export function CheckIn() {
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [posto, setPosto] = useState('')
  const [foto, setFoto] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [hora, setHora] = useState('')
  const nome = localStorage.getItem('nomeUsuario') || 'Salva-vidas'

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return }
    const tick = setInterval(() => setHora(new Date().toLocaleTimeString('pt-BR')), 1000)
    setHora(new Date().toLocaleTimeString('pt-BR'))
    return () => clearInterval(tick)
  }, [navigate])

  const handleFoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setFoto(ev.target.result)
    reader.readAsDataURL(file)
  }

  const confirmar = async () => {
    if (!posto || !foto) return
    setEnviando(true)
    try {
      await new Promise(r => setTimeout(r, 800)) // substituir pela API real
      const agora = new Date()
      const postoObj = POSTOS.find(p => p.id === Number(posto))
      const registro = {
        id: Date.now(),
        tipo: 'checkin',
        usuario: nome,
        posto: postoObj.nome,
        postoLocal: postoObj.local,
        foto,
        timestamp: agora.toISOString(),
      }
      const existentes = JSON.parse(localStorage.getItem('registros') || '[]')
      localStorage.setItem('registros', JSON.stringify([registro, ...existentes]))
      setSucesso(true)
      setTimeout(() => navigate('/dashboard'), 2500)
    } catch {
      alert('Erro ao registrar. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  if (sucesso) return (
    <div className="sucesso-wrap">
      <span className="sucesso-icon">✓</span>
      <h2 className="sucesso-h">CHECK-IN<br />REALIZADO</h2>
      <p className="sucesso-hora">{hora}</p>
      <p style={{ color: '#4a6650', fontFamily: "'Barlow', sans-serif", fontSize: '14px' }}>
        {POSTOS.find(p => p.id === Number(posto))?.nome} — {POSTOS.find(p => p.id === Number(posto))?.local}
      </p>
    </div>
  )

  return (
    <div className="page">
      <div className="topbar">
        <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => navigate('/dashboard')}>← Voltar</button>
        <span className="topbar-hora">{hora}</span>
      </div>

      <div style={s.content}>
        <span className="badge badge-green" style={{ marginBottom: '10px' }}>Entrada</span>
        <h2 style={s.titulo}>CHECK-IN</h2>
        <p style={s.sub}>Selecione o posto e envie sua foto</p>

        {/* Seleção do posto */}
        <div style={s.field}>
          <label style={s.label}>Posto</label>
          <select className="select" value={posto} onChange={e => setPosto(e.target.value)}>
            <option value="">Selecione o posto...</option>
            {POSTOS.map(p => (
              <option key={p.id} value={p.id}>{p.nome} — {p.local}</option>
            ))}
          </select>
        </div>

        {/* Upload de foto */}
        <div style={s.field}>
          <label style={s.label}>Foto de registro</label>
          <div className="foto-area" onClick={() => fileRef.current.click()} style={{ cursor: 'pointer', minHeight: '180px' }}>
            {foto
              ? <img src={foto} alt="preview" />
              : <div style={s.fotoPlaceholder}>
                  <span style={{ fontSize: '32px' }}>📷</span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px', letterSpacing: '1px', color: '#4a6650' }}>TOQUE PARA SELECIONAR</span>
                </div>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={handleFoto} />
          {foto && (
            <button className="btn btn-ghost btn-full" style={{ fontSize: '13px', marginTop: '6px' }} onClick={() => { setFoto(null); fileRef.current.click() }}>
              Trocar foto
            </button>
          )}
        </div>

        <button
          className="btn btn-green btn-full"
          style={{ fontSize: '18px', padding: '16px', letterSpacing: '2px', marginTop: '8px' }}
          onClick={confirmar}
          disabled={!posto || !foto || enviando}
        >
          {enviando ? 'Registrando...' : 'Confirmar Entrada'}
        </button>
      </div>
    </div>
  )
}

const s = {
  content: { padding: '24px 20px' },
  titulo: { fontFamily: "'Bebas Neue', sans-serif", fontSize: '38px', letterSpacing: '3px', color: '#f0f8f2', lineHeight: 1, marginBottom: '6px' },
  sub: { fontFamily: "'Barlow', sans-serif", fontSize: '14px', color: '#4a6650', marginBottom: '24px' },
  field: { marginBottom: '18px' },
  label: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6650', display: 'block', marginBottom: '8px' },
  fotoPlaceholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '32px' },
}