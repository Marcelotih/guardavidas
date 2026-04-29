import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { POSTOS } from '../postos'
import '../global.css'

export function CheckOut() {
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [posto, setPosto] = useState('')
  const [foto, setFoto] = useState(null)
  const [relato, setRelato] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [hora, setHora] = useState('')
  const nome = localStorage.getItem('nomeUsuario') || 'Salva-vidas'

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return }
    const registros = JSON.parse(localStorage.getItem('registros') || '[]')
    const hoje = new Date().toDateString()
    const checkinHoje = registros.find(r => r.tipo === 'checkin' && r.usuario === nome && new Date(r.timestamp).toDateString() === hoje)
    if (checkinHoje) {
      const postoId = POSTOS.find(p => p.nome === checkinHoje.posto)?.id
      if (postoId) setPosto(String(postoId))
    }
    const tick = setInterval(() => setHora(new Date().toLocaleTimeString('pt-BR')), 1000)
    setHora(new Date().toLocaleTimeString('pt-BR'))
    return () => clearInterval(tick)
  }, [navigate, nome])

  const handleFoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setFoto(ev.target.result)
    reader.readAsDataURL(file)
  }

  const confirmar = async () => {
    if (!posto || !foto || !relato.trim()) return
    setEnviando(true)
    try {
      await new Promise(r => setTimeout(r, 800))
      const agora = new Date()
      const postoObj = POSTOS.find(p => p.id === Number(posto))
      const registro = { id: Date.now(), tipo: 'checkout', usuario: nome, posto: postoObj.nome, postoLocal: postoObj.local, foto, relato: relato.trim(), timestamp: agora.toISOString() }
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
      <h2 className="sucesso-h">CHECK-OUT<br />REALIZADO</h2>
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
        <span className="badge badge-gold" style={{ marginBottom: '12px' }}>Registro de Saída</span>
        <h2 style={s.titulo}>CHECK-OUT</h2>
        <div className="gold-line" />

        <div style={s.field}>
          <label style={s.label}>Posto de serviço</label>
          <select className="select" value={posto} onChange={e => setPosto(e.target.value)}>
            <option value="">Selecione o posto...</option>
            {POSTOS.map(p => <option key={p.id} value={p.id}>{p.nome} — {p.local}</option>)}
          </select>
        </div>

        <div style={s.field}>
          <label style={s.label}>Relato do turno</label>
          <textarea
            className="input"
            rows={5}
            placeholder="Descreva ocorrências, condições do mar, intercorrências e observações do turno..."
            value={relato}
            onChange={e => setRelato(e.target.value)}
          />
          <p style={s.hint}>Acesso restrito ao Tenente / Administrador.</p>
        </div>

        <div style={s.field}>
          <label style={s.label}>Foto de encerramento</label>
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

        <button className="btn btn-navy btn-full" style={s.btnConfirm} onClick={confirmar} disabled={!posto || !foto || !relato.trim() || enviando}>
          {enviando ? 'Registrando...' : 'Confirmar Saída'}
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
  hint: { fontFamily: "'Barlow', sans-serif", fontSize: '11px', color: '#2a4a72', marginTop: '6px', fontStyle: 'italic' },
}