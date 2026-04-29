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
      await new Promise(r => setTimeout(r, 800))
      const agora = new Date()
      const postoObj = POSTOS.find(p => p.id === Number(posto))
      const registro = { id: Date.now(), tipo: 'checkin', usuario: nome, posto: postoObj.nome, postoLocal: postoObj.local, foto, timestamp: agora.toISOString() }
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
      <div className="sucesso-icon">✓</div>
      <h2 className="sucesso-h">CHECK-IN<br />REALIZADO</h2>
      <p className="sucesso-hora">{hora}</p>
      <p className="sucesso-sub">{POSTOS.find(p => p.id === Number(posto))?.nome} · {POSTOS.find(p => p.id === Number(posto))?.local}</p>
    </div>
  )

  return (
    <div className="page">
      <div className="topbar">
        <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={() => navigate('/dashboard')}>← Voltar</button>
        <span className="topbar-hora">{hora}</span>
      </div>

      <div style={s.content}>
        <span className="badge badge-green" style={{ marginBottom: '12px' }}>Registro de Entrada</span>
        <h2 style={s.titulo}>CHECK-IN</h2>
        <div className="gold-line" />

        <div style={s.field}>
          <label style={s.label}>Posto de serviço</label>
          <select className="select" value={posto} onChange={e => setPosto(e.target.value)}>
            <option value="">Selecione o posto...</option>
            {POSTOS.map(p => <option key={p.id} value={p.id}>{p.nome} — {p.local}</option>)}
          </select>
        </div>

        <div style={s.field}>
          <label style={s.label}>Foto de identificação</label>
          <div className="foto-area" onClick={() => fileRef.current.click()} style={{ cursor: 'pointer', minHeight: '180px' }}>
            {foto
              ? <img src={foto} alt="preview" />
              : <div style={s.placeholder}>
                  <span style={{ fontSize: '28px', color: '#c9a84c' }}>📷</span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', letterSpacing: '1.5px', color: '#6a8aaa', textTransform: 'uppercase' }}>Toque para selecionar</span>
                </div>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={handleFoto} />
          {foto && (
            <button className="btn btn-ghost btn-full" style={{ fontSize: '12px', marginTop: '6px' }} onClick={() => { setFoto(null); fileRef.current.click() }}>
              Trocar foto
            </button>
          )}
        </div>

        <button className="btn btn-gold btn-full" style={s.btnConfirm} onClick={confirmar} disabled={!posto || !foto || enviando}>
          {enviando ? 'Registrando...' : 'Confirmar Entrada'}
        </button>
      </div>
    </div>
  )
}

const s = {
  content: { padding: '24px 20px' },
  titulo: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '36px', fontWeight: 700, letterSpacing: '3px', color: '#f5f8fc', lineHeight: 1, marginBottom: '12px' },
  field: { marginBottom: '18px' },
  label: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#6a8aaa', display: 'block', marginBottom: '8px' },
  placeholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '32px' },
  btnConfirm: { fontSize: '15px', padding: '15px', letterSpacing: '2px', marginTop: '4px' },
}