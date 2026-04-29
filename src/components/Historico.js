import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../global.css'

export function Historico() {
  const navigate = useNavigate()
  const [registros, setRegistros] = useState([])
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroPosto, setFiltroPosto] = useState('todos')
  const [fotoAberta, setFotoAberta] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('tokenAdmin')
    if (!token) { navigate('/login'); return }
    setRegistros(JSON.parse(localStorage.getItem('registros') || '[]'))
  }, [navigate])

  const filtrados = registros.filter(r => {
    if (filtroTipo !== 'todos' && r.tipo !== filtroTipo) return false
    if (filtroPosto !== 'todos' && r.posto !== filtroPosto) return false
    return true
  })

  const postosUsados = [...new Set(registros.map(r => r.posto))].filter(Boolean)

  return (
    <div className="page">
      {fotoAberta && (
        <div style={s.modal} onClick={() => setFotoAberta(null)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div>
                <p style={s.modalNome}>{fotoAberta.usuario}</p>
                <p style={s.modalInfo}>{fotoAberta.posto} · {new Date(fotoAberta.timestamp).toLocaleString('pt-BR')}</p>
              </div>
              <button style={s.modalClose} onClick={() => setFotoAberta(null)}>✕</button>
            </div>
            <img src={fotoAberta.foto} alt={fotoAberta.usuario} style={{ width: '100%', display: 'block' }} />
            <div style={s.modalFooter}>
              <span className={`badge ${fotoAberta.tipo === 'checkin' ? 'badge-green' : 'badge-gold'}`}>
                {fotoAberta.tipo === 'checkin' ? 'Entrada' : 'Saída'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="topbar">
        <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={() => navigate(-1)}>← Voltar</button>
        <div>
          <div className="topbar-brand">Histórico</div>
        </div>
      </div>

      <div style={s.content}>
        <h2 style={s.titulo}>REGISTROS</h2>
        <div className="gold-line" />

        <div style={s.filtros}>
          <div style={s.filtroGrupo}>
            <label style={s.label}>Tipo</label>
            <select className="select" style={{ fontSize: '13px', padding: '8px 12px' }} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="checkin">Entrada</option>
              <option value="checkout">Saída</option>
            </select>
          </div>
          <div style={s.filtroGrupo}>
            <label style={s.label}>Posto</label>
            <select className="select" style={{ fontSize: '13px', padding: '8px 12px' }} value={filtroPosto} onChange={e => setFiltroPosto(e.target.value)}>
              <option value="todos">Todos</option>
              {postosUsados.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <p style={s.contagem}>{filtrados.length} registro{filtrados.length !== 1 ? 's' : ''}</p>

        {filtrados.length === 0
          ? <div style={s.vazio}><p>Nenhum registro encontrado.</p></div>
          : (
            <div style={s.grid}>
              {filtrados.map(r => (
                <div key={r.id} className="card" style={s.card} onClick={() => setFotoAberta(r)}>
                  <div style={s.cardFoto}>
                    <img src={r.foto} alt={r.usuario} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span className={`badge ${r.tipo === 'checkin' ? 'badge-green' : 'badge-gold'}`} style={s.cardBadge}>
                      {r.tipo === 'checkin' ? 'ENT' : 'SAÍ'}
                    </span>
                  </div>
                  <div style={s.cardInfo}>
                    <p style={s.cardNome}>{r.usuario}</p>
                    <p style={s.cardPosto}>{r.posto}</p>
                    <p style={s.cardHora}>{new Date(r.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  )
}

const s = {
  content: { padding: '20px' },
  titulo: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '32px', fontWeight: 700, letterSpacing: '3px', color: '#f5f8fc', marginBottom: '12px' },
  filtros: { display: 'flex', gap: '12px', marginBottom: '16px' },
  filtroGrupo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#6a8aaa' },
  contagem: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', letterSpacing: '1.5px', color: '#2a4a72', marginBottom: '14px', textTransform: 'uppercase' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' },
  card: { padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'border-color .15s' },
  cardFoto: { position: 'relative', aspectRatio: '1', background: '#0a1828' },
  cardBadge: { position: 'absolute', top: '6px', left: '6px' },
  cardInfo: { padding: '10px 12px' },
  cardNome: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, letterSpacing: '.5px', color: '#e8eef5', marginBottom: '2px' },
  cardPosto: { fontFamily: "'Barlow', sans-serif", fontSize: '11px', color: '#6a8aaa', marginBottom: '4px' },
  cardHora: { fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#c9a84c' },
  vazio: { padding: '40px 0', textAlign: 'center', color: '#6a8aaa', fontFamily: "'Barlow', sans-serif" },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modalBox: { background: '#112a4d', border: '1px solid #c9a84c', borderTop: '3px solid #c9a84c', borderRadius: '8px', overflow: 'hidden', width: '100%', maxWidth: '420px' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #1a3358' },
  modalNome: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '16px', fontWeight: 700, color: '#e8eef5' },
  modalInfo: { fontFamily: "'Barlow', sans-serif", fontSize: '12px', color: '#6a8aaa', marginTop: '2px' },
  modalClose: { background: 'none', border: 'none', color: '#6a8aaa', fontSize: '18px', cursor: 'pointer' },
  modalFooter: { padding: '12px 16px', background: '#0d2340' },
}