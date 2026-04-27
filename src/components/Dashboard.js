import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import '../global.css'

export function Dashboard() {
  const navigate = useNavigate()
  const [hora, setHora] = useState('')
  const nome = localStorage.getItem('nomeUsuario') || 'Salva-vidas'

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('tipoUsuario')
    localStorage.removeItem('nomeUsuario')
    navigate('/login')
  }, [navigate])

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return }
    const tick = setInterval(() => setHora(new Date().toLocaleTimeString('pt-BR')), 1000)
    setHora(new Date().toLocaleTimeString('pt-BR'))
    return () => clearInterval(tick)
  }, [navigate])

  // Status do dia atual
  const registros = JSON.parse(localStorage.getItem('registros') || '[]')
  const hoje = new Date().toDateString()
  const registrosHoje = registros.filter(r => new Date(r.timestamp).toDateString() === hoje && r.usuario === nome)
  const checkinHoje = registrosHoje.find(r => r.tipo === 'checkin')
  const checkoutHoje = registrosHoje.find(r => r.tipo === 'checkout')

  return (
    <div className="page">
      {/* Top bar */}
      <div className="topbar">
        <span className="topbar-brand">⚑ SV-SC</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="topbar-hora">{hora}</span>
          <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={logout}>Sair</button>
        </div>
      </div>

      <div style={s.content}>
        {/* Saudação */}
        <div style={s.greeting}>
          <p style={s.greetSub}>Bem-vindo,</p>
          <h1 style={s.greetName}>{nome.toUpperCase()}</h1>
        </div>

        {/* Status do dia */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <p className="sec-label">Jornada de hoje</p>
          <div style={s.jornadaGrid}>
            <div style={s.jornadaItem}>
              <span style={s.jornadaLabel}>Entrada</span>
              <span style={{ ...s.jornadaHora, color: checkinHoje ? '#39e07a' : '#1e3020' }}>
                {checkinHoje ? new Date(checkinHoje.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </span>
              {checkinHoje && <span className="badge badge-green">OK</span>}
            </div>
            <div style={s.jornadaDivisor} />
            <div style={s.jornadaItem}>
              <span style={s.jornadaLabel}>Saída</span>
              <span style={{ ...s.jornadaHora, color: checkoutHoje ? '#f5a623' : '#1e3020' }}>
                {checkoutHoje ? new Date(checkoutHoje.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </span>
              {checkoutHoje && <span className="badge badge-amber">OK</span>}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div style={s.acoes}>
          {!checkinHoje && (
            <button className="btn btn-green btn-full" style={s.btnAcao} onClick={() => navigate('/checkin')}>
              Registrar Entrada
            </button>
          )}
          {checkinHoje && !checkoutHoje && (
            <button className="btn btn-amber btn-full" style={s.btnAcao} onClick={() => navigate('/checkout')}>
              Registrar Saída
            </button>
          )}
          {checkinHoje && checkoutHoje && (
            <div style={s.jornadaOk}>
              <span style={{ fontSize: '24px' }}>✓</span>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '16px', fontWeight: 600, letterSpacing: '1px' }}>JORNADA FINALIZADA</span>
            </div>
          )}
          <button className="btn btn-ghost btn-full" style={{ fontSize: '14px', letterSpacing: '1px' }} onClick={() => navigate('/historico')}>
            Ver histórico de fotos
          </button>
        </div>
      </div>
    </div>
  )
}

const s = {
  content: { padding: '24px 20px' },
  greeting: { marginBottom: '24px' },
  greetSub: { fontFamily: "'Barlow', sans-serif", fontSize: '13px', color: '#4a6650', marginBottom: '2px' },
  greetName: { fontFamily: "'Bebas Neue', sans-serif", fontSize: '36px', letterSpacing: '3px', color: '#f0f8f2', lineHeight: 1 },
  jornadaGrid: { display: 'flex', alignItems: 'center', gap: '0' },
  jornadaItem: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '8px 0' },
  jornadaLabel: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6650' },
  jornadaHora: { fontFamily: "'DM Mono', monospace", fontSize: '28px', fontWeight: 500, lineHeight: 1, transition: 'color .3s' },
  jornadaDivisor: { width: '1px', height: '50px', background: '#1e3020' },
  acoes: { display: 'flex', flexDirection: 'column', gap: '10px' },
  btnAcao: { fontSize: '18px', padding: '16px', letterSpacing: '2px' },
  jornadaOk: { background: '#0d2e18', border: '1px solid #1e5030', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#39e07a' },
}