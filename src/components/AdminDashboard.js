import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// Gera 21 postos limpos, sem pessoas e sem nomes/ids definidos (apenas a numeração de 1 a 21)
const postosIniciais = Array.from({ length: 21 }, (_, index) => ({
    numero: index + 1,
    salvaVidas: [] // Começa sempre vazio, esperando o check-in
}))

function fmtHora(iso) {
    if (!iso) return '--:--'
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function StatusBadge({ checkin, checkout }) {
    if (checkin && checkout) return <span style={{ ...s.badge, ...s.badgeCompleto }}>Completo</span>
    if (checkin) return <span style={{ ...s.badge, ...s.badgeAndamento }}>Em andamento</span>
    return <span style={{ ...s.badge, ...s.badgeAusente }}>Ausente</span>
}

function CartaoSalvaVidas({ pessoa, onVerFoto, onApagarFotos }) {
    const temFotos = pessoa.checkin?.foto || pessoa.checkout?.foto
    return (
        <div style={s.cartao}>
            <div style={s.cartaoTopo}>
                <div style={s.avatar}>{pessoa.nome ? pessoa.nome.charAt(0) : '?'}</div>
                <div style={s.cartaoInfo}>
                    <span style={s.cartaoNome}>{pessoa.nome || 'Usuário'}</span>
                    <StatusBadge checkin={pessoa.checkin} checkout={pessoa.checkout} />
                </div>
                {temFotos && (
                    <button style={s.btnApagar} title="Apagar fotos" onClick={() => onApagarFotos(pessoa)}>🗑</button>
                )}
            </div>
            <div style={s.registros}>
                <div style={s.registro}>
                    <span style={s.registroLabel}>Entrada</span>
                    <span style={{ ...s.registroHora, color: pessoa.checkin ? '#4ade80' : '#4a5568' }}>{fmtHora(pessoa.checkin?.horario)}</span>
                    {pessoa.checkin?.foto && <button style={s.btnFoto} onClick={() => onVerFoto(pessoa.checkin.foto, `Entrada — ${pessoa.nome}`)}>Ver foto</button>}
                </div>
                <div style={s.divisorVertical} />
                <div style={s.registro}>
                    <span style={s.registroLabel}>Saída</span>
                    <span style={{ ...s.registroHora, color: pessoa.checkout ? '#fb923c' : '#4a5568' }}>{fmtHora(pessoa.checkout?.horario)}</span>
                    {pessoa.checkout?.foto && <button style={s.btnFoto} onClick={() => onVerFoto(pessoa.checkout.foto, `Saída — ${pessoa.nome}`)}>Ver foto</button>}
                </div>
            </div>
        </div>
    )
}

function ModalFoto({ foto, titulo, onFechar }) {
    if (!foto) return null
    return (
        <div style={s.modalOverlay} onClick={onFechar}>
            <div style={s.modalConteudo} onClick={e => e.stopPropagation()}>
                <div style={s.modalHeader}>
                    <span style={s.modalTitulo}>{titulo}</span>
                    <button style={s.modalFechar} onClick={onFechar}>✕</button>
                </div>
                <img src={foto} alt={titulo} style={{ width: '100%', display: 'block' }} />
            </div>
        </div>
    )
}

function ModalConfirmar({ mensagem, onConfirmar, onCancelar }) {
    if (!mensagem) return null
    return (
        <div style={s.modalOverlay} onClick={onCancelar}>
            <div style={{ ...s.modalConteudo, padding: '28px', maxWidth: '360px' }} onClick={e => e.stopPropagation()}>
                <p style={{ color: '#f0f4f8', fontSize: '15px', margin: '0 0 24px', lineHeight: 1.5 }}>{mensagem}</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button style={s.btnCancelar} onClick={onCancelar}>Cancelar</button>
                    <button style={s.btnConfirmarApagar} onClick={onConfirmar}>Confirmar</button>
                </div>
            </div>
        </div>
    )
}

function exportarCSV(postos) {
    const hoje = new Date().toLocaleDateString('pt-BR')
    const linhas = [['Data', 'Posto', 'Nome', 'Horário Entrada', 'Horário Saída', 'Status']]
    postos.forEach(posto => {
        posto.salvaVidas.forEach(pessoa => {
            let status = 'Ausente'
            if (pessoa.checkin && pessoa.checkout) status = 'Completo'
            else if (pessoa.checkin) status = 'Em andamento'
            linhas.push([hoje, `Posto ${posto.numero}`, pessoa.nome, fmtHora(pessoa.checkin?.horario), fmtHora(pessoa.checkout?.horario), status])
        })
    })
    const csv = linhas.map(l => l.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `registros_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
}

export function AdminDashboard() {
    const navigate = useNavigate()
    const [postos, setPostos] = useState([])
    const [carregando, setCarregando] = useState(true)
    const [fotoModal, setFotoModal] = useState(null)
    const [fotoTitulo, setFotoTitulo] = useState('')
    const [confirmacao, setConfirmacao] = useState(null)
    const [dataHoje] = useState(new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }))

    const logout = useCallback(() => {
        localStorage.removeItem('tokenAdmin')
        localStorage.removeItem('tipoUsuario')
        navigate('/login')
    }, [navigate])

    useEffect(() => {
        if (!localStorage.getItem('tokenAdmin')) { navigate('/login'); return }
        // Carrega os 21 postos vazios
        setTimeout(() => { setPostos(postosIniciais); setCarregando(false) }, 500)
    }, [navigate])

    const apagarFotosPessoa = (pessoa) => {
        setConfirmacao({
            mensagem: `Apagar as fotos de ${pessoa.nome}? Esta ação não pode ser desfeita.`,
            onConfirmar: () => {
                setPostos(prev => prev.map(posto => ({
                    ...posto,
                    salvaVidas: posto.salvaVidas.map(sv => sv.id !== pessoa.id ? sv : {
                        ...sv,
                        checkin: sv.checkin ? { ...sv.checkin, foto: null } : null,
                        checkout: sv.checkout ? { ...sv.checkout, foto: null } : null
                    })
                })))
                setConfirmacao(null)
            }
        })
    }

    const apagarHistoricoCompleto = () => {
        setConfirmacao({
            mensagem: 'Apagar todo o histórico de fotos do dia? Esta ação não pode ser desfeita.',
            onConfirmar: () => {
                setPostos(prev => prev.map(posto => ({
                    ...posto,
                    salvaVidas: posto.salvaVidas.map(sv => ({
                        ...sv,
                        checkin: sv.checkin ? { ...sv.checkin, foto: null } : null,
                        checkout: sv.checkout ? { ...sv.checkout, foto: null } : null
                    }))
                })))
                setConfirmacao(null)
            }
        })
    }

    const total = postos.flatMap(p => p.salvaVidas)
    const totalPresentes = total.filter(s => s.checkin).length
    const totalCompletos = total.filter(s => s.checkin && s.checkout).length

    if (carregando) return <div style={s.loading}><p style={{ color: '#6b7e94' }}>Carregando 21 postos...</p></div>

    return (
        <div style={s.pagina}>
            <ModalFoto foto={fotoModal} titulo={fotoTitulo} onFechar={() => setFotoModal(null)} />
            <ModalConfirmar mensagem={confirmacao?.mensagem} onConfirmar={confirmacao?.onConfirmar} onCancelar={() => setConfirmacao(null)} />

            <div style={s.header}>
                <div>
                    <div style={s.headerBadge}>Painel Admin</div>
                    <h1 style={s.headerTitulo}>Registros do Dia</h1>
                    <p style={s.headerData}>{dataHoje}</p>
                </div>
                <div style={s.headerAcoes}>
                    <button style={s.btnExportar} onClick={() => exportarCSV(postos)}>Exportar CSV</button>
                    <button style={s.btnApagarTudo} onClick={apagarHistoricoCompleto}>Apagar histórico</button>
                    <button style={s.btnLogout} onClick={logout}>Sair</button>
                </div>
            </div>

            <div style={s.resumo}>
                {[
                    { num: totalPresentes, label: 'Presentes', cor: '#4ade80' },
                    { num: totalCompletos, label: 'Finalizados', cor: '#fb923c' },
                    { num: total.length, label: 'Total Registros', cor: '#94a3b8' },
                ].map(({ num, label, cor }) => (
                    <div key={label} style={s.resumoCard}>
                        <span style={{ ...s.resumoNumero, color: cor }}>{num}</span>
                        <span style={s.resumoLabel}>{label}</span>
                    </div>
                ))}
            </div>

            <div style={s.conteudo}>
                {postos.map(posto => {
                    // Pega as pessoas alocadas para esse posto (virão do check-in no futuro)
                    const pessoasNoPosto = posto.salvaVidas

                    return (
                        <div key={`posto-${posto.numero}`}>
                            <div style={s.postoHeader}>
                                <h2 style={s.postoNome}>Posto {posto.numero}</h2>
                                <span style={s.postoContagem}>{pessoasNoPosto.length} {pessoasNoPosto.length === 1 ? 'pessoa' : 'pessoas'}</span>
                            </div>
                            
                            {pessoasNoPosto.length > 0 ? (
                                <div style={s.grid}>
                                    {pessoasNoPosto.map((pessoa, i) => (
                                        <CartaoSalvaVidas 
                                            key={pessoa.id || i} 
                                            pessoa={pessoa} 
                                            onVerFoto={(f, t) => { setFotoModal(f); setFotoTitulo(t) }} 
                                            onApagarFotos={apagarFotosPessoa} 
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div style={s.caixaVazia}>
                                    <p style={s.mensagemVazio}>Aguardando check-in neste posto...</p>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

const s = {
    pagina: { minHeight: '100vh', background: '#0f1923', fontFamily: "'DM Sans', sans-serif", color: '#f0f4f8', paddingBottom: '60px' },
    loading: { minHeight: '100vh', background: '#0f1923', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" },
    header: { padding: '32px 32px 24px', borderBottom: '1px solid #1e2d3d', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' },
    headerBadge: { display: 'inline-block', background: '#1e3a5f', color: '#5ba3f5', fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.5px', marginBottom: '10px', textTransform: 'uppercase' },
    headerTitulo: { fontSize: '26px', fontWeight: '600', margin: '0 0 4px', letterSpacing: '-0.5px' },
    headerData: { color: '#6b7e94', fontSize: '14px', margin: 0, textTransform: 'capitalize' },
    headerAcoes: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
    btnExportar: { background: '#14532d', border: '1px solid #166534', color: '#4ade80', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
    btnApagarTudo: { background: '#2d1515', border: '1px solid #7f1d1d', color: '#f87171', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
    btnLogout: { background: 'none', border: '1px solid #2a3a50', color: '#6b7e94', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
    resumo: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#1e2d3d', borderBottom: '1px solid #1e2d3d' },
    resumoCard: { background: '#0f1923', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '4px' },
    resumoNumero: { fontSize: '28px', fontWeight: '600', lineHeight: 1 },
    resumoLabel: { fontSize: '12px', color: '#4a6280', textTransform: 'uppercase', letterSpacing: '0.5px' },
    conteudo: { padding: '32px', display: 'flex', flexDirection: 'column', gap: '40px' },
    postoHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #1a2535' },
    postoNome: { fontSize: '16px', fontWeight: '600', margin: 0, color: '#c8d8e8' },
    postoContagem: { fontSize: '12px', color: '#4a6280', background: '#1a2535', padding: '3px 10px', borderRadius: '20px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' },
    caixaVazia: { background: 'rgba(26, 37, 53, 0.4)', border: '1px dashed #2a3a50', borderRadius: '12px', padding: '24px', textAlign: 'center' },
    mensagemVazio: { color: '#4a6280', fontSize: '13px', margin: 0 },
    cartao: { background: '#1a2535', borderRadius: '12px', padding: '16px', border: '1px solid #2a3a50' },
    cartaoTopo: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' },
    avatar: { width: '38px', height: '38px', borderRadius: '50%', background: '#1e3a5f', color: '#5ba3f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '600', flexShrink: 0 },
    cartaoInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' },
    cartaoNome: { fontSize: '14px', fontWeight: '500', color: '#e2eaf2' },
    badge: { fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '20px', display: 'inline-block' },
    badgeCompleto: { background: '#14532d', color: '#4ade80' },
    badgeAndamento: { background: '#1e3a5f', color: '#60a5fa' },
    badgeAusente: { background: '#2d1515', color: '#f87171' },
    btnApagar: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', opacity: 0.5, padding: '4px', borderRadius: '4px', lineHeight: 1 },
    registros: { display: 'flex', gap: '12px', background: '#0f1923', borderRadius: '8px', padding: '12px' },
    registro: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' },
    registroLabel: { fontSize: '11px', color: '#4a6280', textTransform: 'uppercase', letterSpacing: '0.5px' },
    registroHora: { fontSize: '18px', fontWeight: '600', fontFamily: "'DM Mono', monospace" },
    divisorVertical: { width: '1px', background: '#1e2d3d' },
    btnFoto: { background: 'none', border: '1px solid #2a3a50', color: '#5ba3f5', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginTop: '2px' },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
    modalConteudo: { background: '#1a2535', borderRadius: '12px', overflow: 'hidden', maxWidth: '480px', width: '100%', border: '1px solid #2a3a50' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #2a3a50' },
    modalTitulo: { fontSize: '14px', fontWeight: '500', color: '#c8d8e8' },
    modalFechar: { background: 'none', border: 'none', color: '#6b7e94', fontSize: '16px', cursor: 'pointer' },
    btnCancelar: { background: 'none', border: '1px solid #2a3a50', color: '#6b7e94', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
    btnConfirmarApagar: { background: '#7f1d1d', border: 'none', color: '#fca5a5', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
}