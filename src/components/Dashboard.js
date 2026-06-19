import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { POSTOS, formatPosto, getRegistroPostoId } from '../postos'
import '../global.css'

function HistoricoRegistros() {
  const historico = JSON.parse(localStorage.getItem('registros') || '[]')
  const nome = localStorage.getItem('nomeUsuario') || ''
  const meus = historico.filter(r => r.loginUsuario === nome || r.usuario === nome).slice(0, 5)
  if (meus.length === 0) return null
  return (
    <div style={{ padding: '0 20px' }}>
      <p className="sec-label">Últimos registros</p>
      <div className="card" style={{ padding: '0' }}>
        {meus.map((r, i) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: i < meus.length - 1 ? '1px solid #1a3358' : 'none' }}>
            <span className={`badge ${r.tipo === 'checkin' ? 'badge-green' : 'badge-gold'}`}>
              {r.tipo === 'checkin' ? 'Entrada' : 'Saída'}
            </span>
            <span style={{ flex: 1, fontFamily: "'Barlow', sans-serif", fontSize: '13px', color: '#e8eef5' }}>{formatPosto(r.postoId || r.posto)}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#6a8aaa' }}>
              {new Date(r.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const [hora, setHora] = useState('')
  const [postoSelecionado, setPostoSelecionado] = useState('')
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

  const registros = JSON.parse(localStorage.getItem('registros') || '[]')
  const hoje = new Date().toDateString()
  const regsHoje = registros.filter(r => new Date(r.timestamp).toDateString() === hoje && (r.loginUsuario === nome || r.usuario === nome))
  const checkinHoje = regsHoje.find(r => r.tipo === 'checkin')
  const checkoutHoje = regsHoje.find(r => r.tipo === 'checkout')
  const postoCheckinHoje = getRegistroPostoId(checkinHoje)

  useEffect(() => {
    if (!postoSelecionado && postoCheckinHoje) {
      setPostoSelecionado(String(postoCheckinHoje))
    }
  }, [postoSelecionado, postoCheckinHoje])

  const abrirRegistro = (rota) => {
    if (!postoSelecionado) return
    navigate(`${rota}?posto=${postoSelecionado}`)
  }

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <div className="topbar-brand">⚑ CBMSC</div>
          <div className="topbar-brand-sub">Salva-vidas</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="topbar-hora">{hora}</span>
          <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={logout}>Sair</button>
        </div>
      </div>

      <div style={s.content}>
        {/* Saudação */}
        <div style={s.greeting}>
          <p style={s.greetSub}>Bem-vindo(a),</p>
          <h1 style={s.greetName}>{nome.toUpperCase()}</h1>
          <div className="gold-line" />
        </div>

        {/* Status do dia */}
        <div style={{ marginBottom: '20px' }}>
          <p className="sec-label">Jornada de hoje</p>
          <div className="card-gold">
            <div style={s.jornadaGrid}>
              <div style={s.jornadaItem}>
                <span style={s.jornadaLabel}>Entrada</span>
                <span style={{ ...s.jornadaHora, color: checkinHoje ? '#27ae60' : '#1a3358' }}>
                  {checkinHoje ? new Date(checkinHoje.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </span>
                <span className={`badge ${checkinHoje ? 'badge-green' : 'badge-muted'}`}>
                  {checkinHoje ? 'Registrado' : 'Pendente'}
                </span>
              </div>
              <div style={s.divisor} />
              <div style={s.jornadaItem}>
                <span style={s.jornadaLabel}>Saída</span>
                <span style={{ ...s.jornadaHora, color: checkoutHoje ? '#c9a84c' : '#1a3358' }}>
                  {checkoutHoje ? new Date(checkoutHoje.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </span>
                <span className={`badge ${checkoutHoje ? 'badge-gold' : 'badge-muted'}`}>
                  {checkoutHoje ? 'Registrado' : 'Pendente'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div style={s.acoes}>
          <div className="card" style={s.selecaoCard}>
            <div style={s.field}>
              <label style={s.label}>Selecionar posto</label>
              <select className="select" value={postoSelecionado} onChange={e => setPostoSelecionado(e.target.value)}>
                <option value="">Escolha o posto...</option>
                {POSTOS.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div style={s.operacoes}>
              <button className="btn btn-gold btn-full" style={s.btnAcao} onClick={() => abrirRegistro('/checkin')} disabled={!postoSelecionado}>
                Check-in
              </button>
              <button className="btn btn-navy btn-full" style={s.btnAcao} onClick={() => abrirRegistro('/checkout')} disabled={!postoSelecionado}>
                Check-out
              </button>
            </div>
          </div>

          {checkinHoje && checkoutHoje && (
            <div style={s.jornadaOk}>
              <span style={{ fontSize: '20px' }}>✓</span>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: '1.5px' }}>JORNADA FINALIZADA</span>
            </div>
          )}
          <button className="btn btn-ghost btn-full" style={{ fontSize: '12px', letterSpacing: '1.5px' }} onClick={() => navigate('/historico')}>
            Histórico de Registros
          </button>
        </div>
      </div>

      <HistoricoRegistros />
    </div>
  )
}

const s = {
  content: { padding: '24px 20px 16px' },
  greeting: { marginBottom: '24px' },
  greetSub: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '2px', color: '#6a8aaa', textTransform: 'uppercase', marginBottom: '4px' },
  greetName: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '32px', fontWeight: 700, letterSpacing: '2px', color: '#f5f8fc', lineHeight: 1, marginBottom: '12px' },
  jornadaGrid: { display: 'flex', alignItems: 'center' },
  jornadaItem: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '8px 0' },
  jornadaLabel: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#6a8aaa' },
  jornadaHora: { fontFamily: "'DM Mono', monospace", fontSize: '30px', fontWeight: 500, lineHeight: 1, transition: 'color .3s' },
  divisor: { width: '1px', height: '56px', background: '#1a3358' },
  acoes: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' },
  selecaoCard: { padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#6a8aaa' },
  operacoes: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  btnAcao: { fontSize: '15px', padding: '15px', letterSpacing: '2px' },
  jornadaOk: { background: '#0a2010', border: '1px solid #1a5030', borderRadius: '6px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#27ae60', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '15px', letterSpacing: '1.5px' },
}
