import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { POSTOS, formatPosto, getRegistroPostoId, sortRegistrosPorPosto } from '../postos'
import { api, API_URL } from '../api'
import '../global.css'

function getRelatorioCheckout(registro) {
  const relatorio = registro?.relatorio
  if (!relatorio) return null

  const matutino = relatorio.matutino || {}
  const vespertino = relatorio.vespertino || {}
  const matutinoTotal = Number(matutino.total ?? (Number(matutino.prevencoes) || 0) + (Number(matutino.incidentes) || 0))
  const vespertinoTotal = Number(vespertino.total ?? (Number(vespertino.prevencoes) || 0) + (Number(vespertino.incidentes) || 0))
  const lesoesAguaViva = Number(relatorio.lesoesAguaViva) || 0

  return {
    matutino: {
      prevencoes: Number(matutino.prevencoes) || 0,
      incidentes: Number(matutino.incidentes) || 0,
      total: matutinoTotal,
    },
    vespertino: {
      prevencoes: Number(vespertino.prevencoes) || 0,
      incidentes: Number(vespertino.incidentes) || 0,
      total: vespertinoTotal,
    },
    lesoesAguaViva,
    totalGeral: Number(relatorio.totalGeral ?? matutinoTotal + vespertinoTotal + lesoesAguaViva),
  }
}

const temRelatorioCheckout = registro => registro.tipo === 'checkout' && (getRelatorioCheckout(registro) || registro.relato)

// Gera Excel dos relatórios de check-out usando SheetJS via CDN
async function exportarRelatorioExcel(registros, filtroLabel) {
  // Carrega xlsx dinamicamente
  if (!window.XLSX) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  const XLSX = window.XLSX
  const relatorios = sortRegistrosPorPosto(registros.filter(temRelatorioCheckout))

  if (relatorios.length === 0) {
    throw new Error('Nenhum relatório encontrado para exportar.')
  }

  // Dados para a planilha
  const dados = relatorios.map((r, index) => {
    const data = new Date(r.timestamp)
    const relatorio = getRelatorioCheckout(r)
    
    // Para relatos simples (sem estrutura de relatório)
    if (!relatorio) {
      return {
        'Nº': index + 1,
        'Usuário': r.usuario,
        'Posto': formatPosto(r.postoId || r.posto),
        'Data': data.toLocaleDateString('pt-BR'),
        'Hora': data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        'Tipo': 'Check-out',
        'Prevenções - Matutino': '-',
        'Incidentes - Matutino': '-',
        'Total - Matutino': '-',
        'Prevenções - Vespertino': '-',
        'Incidentes - Vespertino': '-',
        'Total - Vespertino': '-',
        'Lesões Água-viva': '-',
        'Total Geral': '-',
        'Relato': r.relato || '',
      }
    }

    return {
      'Nº': index + 1,
      'Usuário': r.usuario,
      'Posto': formatPosto(r.postoId || r.posto),
      'Data': data.toLocaleDateString('pt-BR'),
      'Hora': data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      'Tipo': 'Check-out',
      'Prevenções - Matutino': relatorio.matutino.prevencoes,
      'Incidentes - Matutino': relatorio.matutino.incidentes,
      'Total - Matutino': relatorio.matutino.total,
      'Prevenções - Vespertino': relatorio.vespertino.prevencoes,
      'Incidentes - Vespertino': relatorio.vespertino.incidentes,
      'Total - Vespertino': relatorio.vespertino.total,
      'Lesões Água-viva': relatorio.lesoesAguaViva,
      'Total Geral': relatorio.totalGeral,
      'Relato': '',
    }
  })

  // Adiciona linha de resumo
  const totais = {
    'Nº': 'TOTAIS',
    'Usuário': '',
    'Posto': '',
    'Data': '',
    'Hora': '',
    'Tipo': '',
    'Prevenções - Matutino': dados.reduce((sum, d) => sum + (Number(d['Prevenções - Matutino']) || 0), 0),
    'Incidentes - Matutino': dados.reduce((sum, d) => sum + (Number(d['Incidentes - Matutino']) || 0), 0),
    'Total - Matutino': dados.reduce((sum, d) => sum + (Number(d['Total - Matutino']) || 0), 0),
    'Prevenções - Vespertino': dados.reduce((sum, d) => sum + (Number(d['Prevenções - Vespertino']) || 0), 0),
    'Incidentes - Vespertino': dados.reduce((sum, d) => sum + (Number(d['Incidentes - Vespertino']) || 0), 0),
    'Total - Vespertino': dados.reduce((sum, d) => sum + (Number(d['Total - Vespertino']) || 0), 0),
    'Lesões Água-viva': dados.reduce((sum, d) => sum + (Number(d['Lesões Água-viva']) || 0), 0),
    'Total Geral': dados.reduce((sum, d) => sum + (Number(d['Total Geral']) || 0), 0),
    'Relato': '',
  }
  dados.push(totais)

  // Cria workbook
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(dados)

  // Define largura das colunas
  ws['!cols'] = [
    { wch: 6 },  // Nº
    { wch: 20 }, // Usuário
    { wch: 25 }, // Posto
    { wch: 12 }, // Data
    { wch: 10 }, // Hora
    { wch: 12 }, // Tipo
    { wch: 18 }, // Prevenções - Matutino
    { wch: 18 }, // Incidentes - Matutino
    { wch: 15 }, // Total - Matutino
    { wch: 20 }, // Prevenções - Vespertino
    { wch: 20 }, // Incidentes - Vespertino
    { wch: 17 }, // Total - Vespertino
    { wch: 18 }, // Lesões Água-viva
    { wch: 15 }, // Total Geral
    { wch: 30 }, // Relato
  ]

  // Adiciona metadados
  const info = [
    ['RELATÓRIO DE CHECK-OUT'],
    ['SALVA-VIDAS SC'],
    [`Gerado em: ${new Date().toLocaleString('pt-BR')}`],
    [`Filtro: ${filtroLabel || 'Todos os postos'}`],
    [''],
  ]
  
  // Insere metadados no topo
  const wsData = XLSX.utils.sheet_to_json(ws, { header: 1 })
  const finalData = [...info, ...wsData]
  const wsFinal = XLSX.utils.aoa_to_sheet(finalData)
  
  // Mescla células do cabeçalho
  wsFinal['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 14 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 14 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 14 } },
  ]

  // Aplica estilos básicos (SheetJS não suporta estilos avançados sem plugin)
  // Mas podemos aplicar formatação de números
  const range = XLSX.utils.decode_range(wsFinal['!ref'])
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C })
      if (!wsFinal[addr]) continue
      if (R >= 5 && C >= 6 && C <= 13) { // Colunas numéricas
        if (typeof wsFinal[addr].v === 'number') {
          wsFinal[addr].t = 'n'
        }
      }
    }
  }

  // Adiciona a planilha ao workbook
  XLSX.utils.book_append_sheet(wb, wsFinal, 'Relatório Check-out')

  // Gera arquivo
  const fileName = `relatorio_checkout_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, fileName)
}

function ModalFotoAdmin({ foto, usuario, posto, timestamp, tipo, onFechar }) {
  if (!foto) return null
  const src = foto.startsWith('/arquivos/') ? `${API_URL}${foto}` : foto
  return (
    <div style={ms.overlay} onClick={onFechar}>
      <div style={ms.box} onClick={e => e.stopPropagation()}>
        <div style={ms.header}>
          <div>
            <p style={ms.nome}>{usuario}</p>
            <p style={ms.info}>{formatPosto(posto)} · {new Date(timestamp).toLocaleString('pt-BR')}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className={`badge ${tipo === 'checkin' ? 'badge-green' : 'badge-gold'}`}>
              {tipo === 'checkin' ? 'Entrada' : 'Saída'}
            </span>
            <button style={ms.close} onClick={onFechar}>✕</button>
          </div>
        </div>
        <img src={src} alt={usuario} style={{ width: '100%', display: 'block', maxHeight: '70vh', objectFit: 'contain', background: '#060d18' }} />
      </div>
    </div>
  )
}

const ms = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  box: { background: '#112a4d', border: '1px solid #c9a84c', borderTop: '3px solid #c9a84c', borderRadius: '8px', overflow: 'hidden', width: '100%', maxWidth: '500px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #1a3358', gap: '10px' },
  nome: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '15px', fontWeight: 700, color: '#e8eef5' },
  info: { fontFamily: "'Barlow', sans-serif", fontSize: '11px', color: '#6a8aaa', marginTop: '2px' },
  close: { background: 'none', border: 'none', color: '#6a8aaa', fontSize: '18px', cursor: 'pointer', flexShrink: 0 },
}

function RegistroRow({ r }) {
  const [aberto, setAberto] = useState(false)
  const [fotoAberta, setFotoAberta] = useState(false)
  const relatorio = getRelatorioCheckout(r)
  const temRelatorio = r.tipo === 'checkout' && (relatorio || r.relato)
  const src = r.fotoUrl ? `${API_URL}${r.fotoUrl}` : r.foto

  return (
    <>
      {fotoAberta && (
        <ModalFotoAdmin
          foto={r.fotoUrl || r.foto}
          usuario={r.usuario}
          posto={r.postoId || r.posto}
          timestamp={r.timestamp}
          tipo={r.tipo}
          onFechar={() => setFotoAberta(false)}
        />
      )}
      <div style={s.row}>
        <div style={{ ...s.rowFoto, cursor: 'pointer', position: 'relative' }} onClick={() => setFotoAberta(true)} title="Clique para ampliar">
          <img src={src} alt={r.usuario} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={s.fotoOverlay}>🔍</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span className={`badge ${r.tipo === 'checkin' ? 'badge-green' : 'badge-gold'}`}>
              {r.tipo === 'checkin' ? 'ENT' : 'SAÍ'}
            </span>
            <span style={s.rowNome}>{r.usuario}</span>
            {temRelatorio && (
              <button onClick={() => setAberto(!aberto)} style={s.btnRelato}>
                {aberto ? '▲ relatório' : '▼ relatório'}
              </button>
            )}
          </div>
          <p style={s.rowPosto}>{formatPosto(r.postoId || r.posto)}</p>
          <p style={s.rowHora}>{new Date(r.timestamp).toLocaleString('pt-BR')}</p>
          {temRelatorio && aberto && (
            <div style={s.relatoBox}>
              <p style={s.relatoLabel}>{relatorio ? 'Relatório do check-out' : 'Relato do turno'}</p>
              {relatorio ? (
                <div style={s.relatorioGrid}>
                  <div style={s.relatorioItem}>
                    <span style={s.relatorioNome}>Matutino</span>
                    <span style={s.relatorioValor}>Prev. {relatorio.matutino.prevencoes} · Inc. {relatorio.matutino.incidentes}</span>
                    <strong style={s.relatorioTotal}>{relatorio.matutino.total}</strong>
                  </div>
                  <div style={s.relatorioItem}>
                    <span style={s.relatorioNome}>Vespertino</span>
                    <span style={s.relatorioValor}>Prev. {relatorio.vespertino.prevencoes} · Inc. {relatorio.vespertino.incidentes}</span>
                    <strong style={s.relatorioTotal}>{relatorio.vespertino.total}</strong>
                  </div>
                  <div style={s.relatorioItem}>
                    <span style={s.relatorioNome}>Água-viva</span>
                    <span style={s.relatorioValor}>Lesões registradas</span>
                    <strong style={s.relatorioTotal}>{relatorio.lesoesAguaViva}</strong>
                  </div>
                  <div style={{ ...s.relatorioItem, borderColor: '#c9a84c' }}>
                    <span style={s.relatorioNome}>Total geral</span>
                    <span style={s.relatorioValor}>Ocorrências do posto</span>
                    <strong style={{ ...s.relatorioTotal, color: '#c9a84c' }}>{relatorio.totalGeral}</strong>
                  </div>
                </div>
              ) : (
                <p style={s.relatoTexto}>{r.relato}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
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

  const carregarRegistros = useCallback(() => {
    let url = '/check/admin/registros'
    const params = []
    if (filtroPosto && filtroPosto !== 'todos') {
      params.push(`postoId=${filtroPosto}`)
    }
    if (filtroData) {
      params.push(`data=${filtroData}`)
    }
    if (params.length > 0) {
      url += `?${params.join('&')}`
    }

    api.get(url)
      .then(data => setRegistros(data || []))
      .catch(err => {
        console.error('Erro ao carregar registros do admin:', err)
        if (err.message && err.message.includes('401')) {
          logout()
        }
      })
  }, [filtroPosto, filtroData, logout])

  useEffect(() => {
    if (!localStorage.getItem('tokenAdmin')) { navigate('/login'); return }
    carregarRegistros()
    const tick = setInterval(() => setHora(new Date().toLocaleTimeString('pt-BR')), 1000)
    setHora(new Date().toLocaleTimeString('pt-BR'))
    return () => clearInterval(tick)
  }, [navigate, carregarRegistros])

  const apagarTudo = () => {
    api.delete('/check/admin/registros')
      .then(() => {
        setRegistros([])
        setConfirmaApagar(false)
      })
      .catch(err => {
        alert(err.message || 'Erro ao apagar histórico.')
      })
  }

  const handleExportarExcel = async () => {
    setGerando(true)
    try {
      const totalRelatoriosAlvo = registros.filter(temRelatorioCheckout).length
      if (totalRelatoriosAlvo === 0) {
        alert('Nenhum relatório encontrado para exportar.')
        return
      }
      let label = ''
      if (filtroPosto !== 'todos') label += `Posto: ${formatPosto(filtroPosto)}`
      if (filtroData) label += `${label ? ' · ' : ''}Data: ${new Date(filtroData + 'T12:00:00').toLocaleDateString('pt-BR')}`
      await exportarRelatorioExcel(registros, label)
    } catch (err) {
      alert(err.message || 'Erro ao exportar planilha.')
    } finally {
      setGerando(false)
    }
  }

  // Resumo por posto
  const hoje = new Date().toDateString()
  const resumoPorPosto = POSTOS.map(posto => {
    const regsHoje = registros.filter(r => new Date(r.timestamp).toDateString() === hoje && getRegistroPostoId(r) === posto.id)
    const checkins = regsHoje.filter(r => r.tipo === 'checkin').length
    const checkouts = regsHoje.filter(r => r.tipo === 'checkout').length
    return { ...posto, checkins, checkouts }
  }).filter(p => p.checkins > 0 || p.checkouts > 0)

  const totalRelatorios = registros.filter(temRelatorioCheckout).length
  const registrosOrdenados = sortRegistrosPorPosto(registros)

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
        <div><div className="topbar-brand">⚑ CBMSC</div><div className="topbar-brand-sub">Tenente / Admin</div></div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="topbar-hora">{hora}</span>
          <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={logout}>Sair</button>
        </div>
      </div>

      <div style={s.content}>
        <h2 style={s.titulo}>PAINEL<br/>TENENTE</h2>

        {/* Ações admin */}
        <div style={s.adminAcoes}>
          <button
            className="btn btn-gold"
            style={{ flex: 1, fontSize: '13px', letterSpacing: '1px', opacity: gerando ? 0.6 : 1 }}
            onClick={handleExportarExcel}
            disabled={gerando}
          >
            {gerando ? 'Gerando Excel...' : `📊 Exportar Excel${totalRelatorios > 0 ? ` (${totalRelatorios})` : ''}`}
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
                  <div style={s.resumoNums}>
                    <span style={{ color: '#27ae60', fontFamily: "'DM Mono', monospace", fontSize: '20px' }}>{p.checkins}</span>
                    <span style={{ color: '#6a8aaa', fontSize: '12px' }}>ent</span>
                    <span style={{ color: '#6a8aaa' }}>·</span>
                    <span style={{ color: '#c9a84c', fontFamily: "'DM Mono', monospace", fontSize: '20px' }}>{p.checkouts}</span>
                    <span style={{ color: '#6a8aaa', fontSize: '12px' }}>saí</span>
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
            {POSTOS.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <input className="input" type="date" style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }}
            value={filtroData} onChange={e => setFiltroData(e.target.value)} />
        </div>

        <p style={s.contagem}>{registros.length} registro{registros.length !== 1 ? 's' : ''}{totalRelatorios > 0 ? ` · ${totalRelatorios} relatório${totalRelatorios !== 1 ? 's' : ''}` : ''}</p>

        {registros.length === 0
          ? <div style={s.vazio}><p>Nenhum registro.</p></div>
          : (
            <div style={s.lista}>
              {registrosOrdenados.map(r => <RegistroRow key={r.id} r={r} />)}
            </div>
          )
        }
      </div>
    </div>
  )
}

const s = {
  content: { padding: '20px' },
  titulo: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '36px', fontWeight: 700, letterSpacing: '3px', color: '#f5f8fc', lineHeight: 1, marginBottom: '20px' },
  adminAcoes: { display: 'flex', gap: '10px', marginBottom: '24px' },
  resumoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' },
  resumoCard: { padding: '12px' },
  resumoNome: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 600, letterSpacing: '.5px', color: '#e8eef5', marginBottom: '2px' },
  resumoLocal: { fontFamily: "'Barlow', sans-serif", fontSize: '10px', color: '#6a8aaa', marginBottom: '8px' },
  resumoNums: { display: 'flex', alignItems: 'center', gap: '4px' },
  filtros: { display: 'flex', gap: '10px', marginBottom: '12px' },
  contagem: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', letterSpacing: '1px', color: '#6a8aaa', marginBottom: '12px' },
  lista: { display: 'flex', flexDirection: 'column', gap: '8px' },
  row: { background: '#112a4d', border: '1px solid #1a3358', borderRadius: '8px', display: 'flex', gap: '12px', padding: '12px', alignItems: 'flex-start' },
  rowFoto: { width: '52px', height: '52px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, position: 'relative', background: '#060a08' },
  fotoOverlay: { position: 'absolute', inset: 0, background: 'rgba(13,35,64,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', opacity: 0, transition: 'opacity .15s' },
  rowNome: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '15px', fontWeight: 600, color: '#e8eef5' },
  rowPosto: { fontFamily: "'Barlow', sans-serif", fontSize: '12px', color: '#6a8aaa', marginBottom: '2px' },
  rowHora: { fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#6a8aaa' },
  vazio: { padding: '40px 0', textAlign: 'center', color: '#6a8aaa', fontFamily: "'Barlow', sans-serif" },
  btnRelato: { background: 'none', border: '1px solid #1a3358', borderRadius: '4px', color: '#6a8aaa', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', padding: '2px 7px', cursor: 'pointer' },
  relatoBox: { marginTop: '10px', background: '#0a1828', border: '1px solid #1a3358', borderRadius: '6px', padding: '12px' },
  relatoLabel: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: '#6a8aaa', marginBottom: '6px' },
  relatoTexto: { fontFamily: "'Barlow', sans-serif", fontSize: '13px', color: '#e8eef5', lineHeight: 1.6, whiteSpace: 'pre-wrap' },
  relatorioGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' },
  relatorioItem: { border: '1px solid #1a3358', borderRadius: '6px', padding: '10px', background: '#0d2340', display: 'flex', flexDirection: 'column', gap: '3px' },
  relatorioNome: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#e8eef5' },
  relatorioValor: { fontFamily: "'Barlow', sans-serif", fontSize: '11px', color: '#6a8aaa' },
  relatorioTotal: { fontFamily: "'DM Mono', monospace", fontSize: '20px', color: '#e8eef5', lineHeight: 1 },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' },
  modalBox: { background: '#112a4d', border: '1px solid #1a3358', borderRadius: '10px', padding: '24px', width: '100%', maxWidth: '360px' },
  modalTxt: { fontFamily: "'Barlow', sans-serif", fontSize: '15px', color: '#e8eef5', marginBottom: '20px', lineHeight: 1.5 },
}