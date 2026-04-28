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
    const checkinHoje = registros.find(r =>
      r.tipo === 'checkin' && r.usuario === nome && new Date(r.timestamp).toDateString() === hoje
    )
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
    if (!posto || !foto) return
    setEnviando(true)
    try {
      await new Promise(r => setTimeout(r, 800))
      const agora = new Date()
      const postoObj = POSTOS.find(p => p.id === Number(posto))
      const registro = {
        id: Date.now(),
        tipo: 'checkout',
        usuario: nome,
        posto: postoObj.nome,
        postoLocal: postoObj.local,
        foto,
        relato: relato.trim(),
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
      <h2 className="sucesso-h">CHECK-OUT<br />REALIZADO</h2>
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
        <span className="badge badge-amber" style={{ marginBottom: '10px' }}>Saída</span>
        <h2 style={s.titulo}>CHECK-OUT</h2>
        <p style={s.sub}>Selecione o posto, escreva o relato e envie sua foto</p>

        {/* Posto */}
        <div style={s.field}>
          <label style={s.label}>Posto</label>
          <select className="select" value={posto} onChange={e => setPosto(e.target.value)}>
            <option value="">Selecione o posto...</option>
            {POSTOS.map(p => (
              <option key={p.id} value={p.id}>{p.nome} — {p.local}</option>
            ))}
          </select>
        </div>

        {/* Relato do dia */}
        <div style={s.field}>
          <label style={s.label}>Relato do dia</label>
          <textarea
            className="input"
            placeholder="Descreva o que aconteceu durante o expediente: ocorrências, condições do mar, intercorrências, observações..."
            value={relato}
            onChange={e => setRelato(e.target.value)}
            rows={5}
            style={{ resize: 'vertical', lineHeight: '1.5' }}
          />
          <p style={s.hint}>Obrigatório para finalizar o turno. Apenas o admin terá acesso.</p>
        </div>

        {/* Foto */}
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
            <button className="btn btn-ghost btn-full" style={{ fontSize: '13px', marginTop: '6px' }}
              onClick={() => { setFoto(null); fileRef.current.click() }}>
              Trocar foto
            </button>
          )}
        </div>

        <button
          className="btn btn-amber btn-full"
          style={{ fontSize: '18px', padding: '16px', letterSpacing: '2px', marginTop: '8px' }}
          onClick={confirmar}
          disabled={!posto || !foto || !relato.trim() || enviando}
        >
          {enviando ? 'Registrando...' : 'Confirmar Saída'}
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
  hint: { fontFamily: "'Barlow', sans-serif", fontSize: '11px', color: '#4a6650', marginTop: '6px', fontStyle: 'italic' },
}