import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { POSTOS } from '../postos'
import '../global.css'

// Gera PDF dos relatórios (somente checkouts com relato) usando jsPDF via CDN
async function exportarRelatorioPDF(registros, filtroLabel) {
  // Carrega jsPDF dinamicamente
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const relatos = registros.filter(r => r.tipo === 'checkout' && r.relato)
  const dataGeracao = new Date().toLocaleString('pt-BR')
  const W = 210
  const margin = 18
  const maxW = W - margin * 2

  // ── Cabeçalho ──
  doc.setFillColor(17, 26, 21)
  doc.rect(0, 0, W, 36, 'F')
  doc.setTextColor(57, 224, 122)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('SALVA-VIDAS SC', margin, 16)
  doc.setFontSize(9)
  doc.setTextColor(74, 102, 80)
  doc.setFont('helvetica', 'normal')
  doc.text('Relatório de Ocorrências e Relatos de Turno', margin, 23)
  doc.text(`Gerado em: ${dataGeracao}`, margin, 29)
  if (filtroLabel) doc.text(`Filtro: ${filtroLabel}`, margin, 34)

  let y = 46

  const checkPage = (needed = 10) => {
    if (y + needed > 280) {
      doc.addPage()
      // mini header na nova página
      doc.setFillColor(17, 26, 21)
      doc.rect(0, 0, W, 14, 'F')
      doc.setFontSize(8)
      doc.setTextColor(74, 102, 80)
      doc.setFont('helvetica', 'normal')
      doc.text('SALVA-VIDAS SC — Relatório de Relatos', margin, 9)
      y = 22
    }
  }

  if (relatos.length === 0) {
    doc.setFontSize(12)
    doc.setTextColor(74, 102, 80)
    doc.setFont('helvetica', 'italic')
    doc.text('Nenhum relato encontrado para os filtros selecionados.', margin, y)
  } else {
    relatos.forEach((r, i) => {
      const data = new Date(r.timestamp)
      const dataStr = data.toLocaleDateString('pt-BR')
      const horaStr = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

      checkPage(40)

      // Separador entre relatórios
      if (i > 0) {
        doc.setDrawColor(30, 48, 32)
        doc.line(margin, y - 3, W - margin, y - 3)
      }

      // Badge tipo
      doc.setFillColor(46, 31, 0)
      doc.roundedRect(margin, y, 18, 6, 1, 1, 'F')
      doc.setFontSize(7)
      doc.setTextColor(245, 166, 35)
      doc.setFont('helvetica', 'bold')
      doc.text('SAÍDA', margin + 2, y + 4.2)

      // Nome e posto
      doc.setFontSize(12)
      doc.setTextColor(212, 232, 216)
      doc.setFont('helvetica', 'bold')
      doc.text(r.usuario, margin + 22, y + 4.5)

      // Data/hora e posto na linha seguinte
      y += 9
      doc.setFontSize(9)
      doc.setTextColor(74, 102, 80)
      doc.setFont('helvetica', 'normal')
      doc.text(`${r.posto}  ·  ${dataStr} às ${horaStr}`, margin, y)

      // Caixa do relato
      y += 5
      const linhasRelato = doc.splitTextToSize(r.relato, maxW - 8)
      const alturaRelato = linhasRelato.length * 5 + 8

      checkPage(alturaRelato + 4)

      doc.setFillColor(10, 15, 10)
      doc.setDrawColor(30, 48, 32)
      doc.roundedRect(margin, y, maxW, alturaRelato, 2, 2, 'FD')

      doc.setFontSize(7)
      doc.setTextColor(74, 102, 80)
      doc.setFont('helvetica', 'bold')
      doc.text('RELATO DO TURNO', margin + 4, y + 5)

      doc.setFontSize(9.5)
      doc.setTextColor(212, 232, 216)
      doc.setFont('helvetica', 'normal')
      doc.text(linhasRelato, margin + 4, y + 11)

      y += alturaRelato + 10
    })
  }

  // Rodapé na última página
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFontSize(7)
    doc.setTextColor(74, 102, 80)
    doc.setFont('helvetica', 'normal')
    doc.text(`Página ${p} de ${totalPages}`, W - margin, 290, { align: 'right' })
    doc.text('Documento confidencial — acesso restrito ao Tenente/Admin', margin, 290)
  }

  const fileName = `relatorio_relatos_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(fileName)
}

function RegistroRow({ r }) {
  const [aberto, setAberto] = useState(false)
  const temRelato = r.tipo === 'checkout' && r.relato

  return (
    <div style={s.row}>
      <div style={s.rowFoto}>
        <img src={r.foto} alt={r.usuario} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span className={`badge ${r.tipo === 'checkin' ? 'badge-green' : 'badge-amber'}`}>
            {r.tipo === 'checkin' ? 'ENT' : 'SAÍ'}
          </span>
          <span style={s.rowNome}>{r.usuario}</span>
          {temRelato && (
            <button onClick={() => setAberto(!aberto)} style={s.btnRelato}>
              {aberto ? '▲ relato' : '▼ relato'}
            </button>
          )}
        </div>
        <p style={s.rowPosto}>{r.posto}</p>
        <p style={s.rowHora}>{new Date(r.timestamp).toLocaleString('pt-BR')}</p>
        {temRelato && aberto && (
          <div style={s.relatoBox}>
            <p style={s.relatoLabel}>Relato do turno</p>
            <p style={s.relatoTexto}>{r.relato}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function AdminDashboard() {
  const navigate = useNavigate()
  const [registros, setRegistros] = useState([])
  const [filtroPosto, setFiltroPosto] = useState('todos')
  const [filtroData, setFiltroData] = useState('')
  const [confirmaApagar, setConfirmaApagar] = useState(false)
  const [hora, setHora] = useState('')
  const [gerando, setGerando] = useState(false)

  const logout = useCallback(() => {
    localStorage.removeItem('tokenAdmin')
    localStorage.removeItem('tipoUsuario')
    localStorage.removeItem('nomeUsuario')
    navigate('/login')
  }, [navigate])

  useEffect(() => {
    if (!localStorage.getItem('tokenAdmin')) { navigate('/login'); return }
    setRegistros(JSON.parse(localStorage.getItem('registros') || '[]'))
    const tick = setInterval(() => setHora(new Date().toLocaleTimeString('pt-BR')), 1000)
    setHora(new Date().toLocaleTimeString('pt-BR'))
    return () => clearInterval(tick)
  }, [navigate])

  const filtrados = registros.filter(r => {
    if (filtroPosto !== 'todos' && r.posto !== filtroPosto) return false
    if (filtroData) {
      const dataR = new Date(r.timestamp).toISOString().slice(0, 10)
      if (dataR !== filtroData) return false
    }
    return true
  })

  const apagarTudo = () => {
    localStorage.removeItem('registros')
    setRegistros([])
    setConfirmaApagar(false)
  }

  const handleExportarPDF = async () => {
    setGerando(true)
    try {
      const alvo = filtrados.length < registros.length ? filtrados : registros
      const totalRelatos = alvo.filter(r => r.tipo === 'checkout' && r.relato).length
      if (totalRelatos === 0) {
        alert('Nenhum relato encontrado para exportar.')
        return
      }
      let label = ''
      if (filtroPosto !== 'todos') label += `Posto: ${filtroPosto}`
      if (filtroData) label += `${label ? ' · ' : ''}Data: ${new Date(filtroData + 'T12:00:00').toLocaleDateString('pt-BR')}`
      await exportarRelatorioPDF(alvo, label)
    } finally {
      setGerando(false)
    }
  }

  // Resumo por posto
  const hoje = new Date().toDateString()
  const resumoPorPosto = POSTOS.map(posto => {
    const regsHoje = registros.filter(r => new Date(r.timestamp).toDateString() === hoje && r.posto === posto.nome)
    const checkins = regsHoje.filter(r => r.tipo === 'checkin').length
    const checkouts = regsHoje.filter(r => r.tipo === 'checkout').length
    return { ...posto, checkins, checkouts }
  }).filter(p => p.checkins > 0 || p.checkouts > 0)

  const postosUsados = [...new Set(registros.map(r => r.posto))].filter(Boolean)
  const totalRelatos = filtrados.filter(r => r.tipo === 'checkout' && r.relato).length

  return (
    <div className="page">
      {/* Modal confirmar apagar */}
      {confirmaApagar && (
        <div style={s.modal}>
          <div style={s.modalBox}>
            <p style={s.modalTxt}>Apagar todo o histórico? Esta ação não pode ser desfeita.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmaApagar(false)}>Cancelar</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={apagarTudo}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="topbar">
        <span className="topbar-brand"> ADMIN</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="topbar-hora">{hora}</span>
          <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={logout}>Sair</button>
        </div>
      </div>

      <div style={s.content}>
        <h2 style={s.titulo}>PAINEL<br />TENENTE</h2>

        {/* Ações admin */}
        <div style={s.adminAcoes}>
          <button
            className="btn btn-green"
            style={{ flex: 1, fontSize: '13px', letterSpacing: '1px', opacity: gerando ? 0.6 : 1 }}
            onClick={handleExportarPDF}
            disabled={gerando}
          >
            {gerando ? 'Gerando PDF...' : `↓ Relatório PDF${totalRelatos > 0 ? ` (${totalRelatos})` : ''}`}
          </button>
          <button className="btn btn-danger" style={{ flex: 1, fontSize: '13px', letterSpacing: '1px' }}
            onClick={() => setConfirmaApagar(true)}>
            ✕ Apagar Histórico
          </button>
        </div>

        {/* Resumo do dia por posto */}
        {resumoPorPosto.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <p className="sec-label">Resumo de hoje por posto</p>
            <div style={s.resumoGrid}>
              {resumoPorPosto.map(p => (
                <div key={p.id} className="card" style={s.resumoCard}>
                  <p style={s.resumoNome}>{p.nome}</p>
                  <p style={s.resumoLocal}>{p.local}</p>
                  <div style={s.resumoNums}>
                    <span style={{ color: '#39e07a', fontFamily: "'DM Mono', monospace", fontSize: '20px' }}>{p.checkins}</span>
                    <span style={{ color: '#4a6650', fontSize: '12px' }}>ent</span>
                    <span style={{ color: '#4a6650' }}>·</span>
                    <span style={{ color: '#f5a623', fontFamily: "'DM Mono', monospace", fontSize: '20px' }}>{p.checkouts}</span>
                    <span style={{ color: '#4a6650', fontSize: '12px' }}>saí</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtros */}
        <p className="sec-label">Todos os registros</p>
        <div style={s.filtros}>
          <select className="select" style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }}
            value={filtroPosto} onChange={e => setFiltroPosto(e.target.value)}>
            <option value="todos">Todos os postos</option>
            {postosUsados.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <input className="input" type="date" style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }}
            value={filtroData} onChange={e => setFiltroData(e.target.value)} />
        </div>

        <p style={s.contagem}>{filtrados.length} registro{filtrados.length !== 1 ? 's' : ''}{totalRelatos > 0 ? ` · ${totalRelatos} relato${totalRelatos !== 1 ? 's' : ''}` : ''}</p>

        {filtrados.length === 0
          ? <div style={s.vazio}><p>Nenhum registro.</p></div>
          : (
            <div style={s.lista}>
              {filtrados.map(r => <RegistroRow key={r.id} r={r} />)}
            </div>
          )
        }
      </div>
    </div>
  )
}

const s = {
  content: { padding: '20px' },
  titulo: { fontFamily: "'Bebas Neue', sans-serif", fontSize: '36px', letterSpacing: '3px', color: '#f0f8f2', lineHeight: 1, marginBottom: '20px' },
  adminAcoes: { display: 'flex', gap: '10px', marginBottom: '24px' },
  resumoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' },
  resumoCard: { padding: '12px' },
  resumoNome: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 600, letterSpacing: '.5px', color: '#d4e8d8', marginBottom: '2px' },
  resumoLocal: { fontFamily: "'Barlow', sans-serif", fontSize: '10px', color: '#4a6650', marginBottom: '8px' },
  resumoNums: { display: 'flex', alignItems: 'center', gap: '4px' },
  filtros: { display: 'flex', gap: '10px', marginBottom: '12px' },
  contagem: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', letterSpacing: '1px', color: '#4a6650', marginBottom: '12px' },
  lista: { display: 'flex', flexDirection: 'column', gap: '8px' },
  row: { background: '#111a15', border: '1px solid #1e3020', borderRadius: '8px', display: 'flex', gap: '12px', padding: '12px', alignItems: 'flex-start' },
  rowFoto: { width: '52px', height: '52px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, background: '#060a08' },
  rowNome: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '15px', fontWeight: 600, color: '#d4e8d8' },
  rowPosto: { fontFamily: "'Barlow', sans-serif", fontSize: '12px', color: '#4a6650', marginBottom: '2px' },
  rowHora: { fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#4a6650' },
  vazio: { padding: '40px 0', textAlign: 'center', color: '#4a6650', fontFamily: "'Barlow', sans-serif" },
  btnRelato: { background: 'none', border: '1px solid #1e3020', borderRadius: '4px', color: '#4a6650', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', padding: '2px 7px', cursor: 'pointer' },
  relatoBox: { marginTop: '10px', background: '#0a0f0d', border: '1px solid #1e3020', borderRadius: '6px', padding: '12px' },
  relatoLabel: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6650', marginBottom: '6px' },
  relatoTexto: { fontFamily: "'Barlow', sans-serif", fontSize: '13px', color: '#d4e8d8', lineHeight: 1.6, whiteSpace: 'pre-wrap' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' },
  modalBox: { background: '#111a15', border: '1px solid #1e3020', borderRadius: '10px', padding: '24px', width: '100%', maxWidth: '360px' },
  modalTxt: { fontFamily: "'Barlow', sans-serif", fontSize: '15px', color: '#d4e8d8', marginBottom: '20px', lineHeight: 1.5 },
}