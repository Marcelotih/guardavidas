import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../global.css'

function gerarRelatorioCSV() {
    const reg = JSON.parse(localStorage.getItem('registroHoje') || '{}')
    const hist = JSON.parse(localStorage.getItem('historicoRegistros') || '[]')
    const nome = localStorage.getItem('nomeUsuario') || 'Salva-vidas'
    const hoje = new Date().toLocaleDateString('pt-BR')

    const linhas = [
        ['Relatório de Ponto — ' + nome],
        ['Data', 'Tipo', 'Horário'],
        [hoje, 'Entrada (Check-in)', reg.checkin || '--'],
        [hoje, 'Saída (Check-out)', reg.checkout || '--'],
        [],
        ['--- Histórico completo ---'],
        ['Data', 'Tipo', 'Horário'],
        ...hist.map(r => [r.data, r.tipo === 'checkin' ? 'Entrada' : 'Saída', r.hora])
    ]

    const csv = linhas.map(l => l.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
}

export function CheckOut() {
    const navigate = useNavigate()
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)

    const [foto, setFoto] = useState(null)
    const [cameraAtiva, setCameraAtiva] = useState(false)
    const [enviando, setEnviando] = useState(false)
    const [sucesso, setSucesso] = useState(false)
    const [hora, setHora] = useState('')
    const [registroHoje, setRegistroHoje] = useState(null)

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) { navigate('/login'); return }
        const tick = setInterval(() => setHora(new Date().toLocaleTimeString('pt-BR')), 1000)
        setHora(new Date().toLocaleTimeString('pt-BR'))

        const reg = JSON.parse(localStorage.getItem('registroHoje') || 'null')
        const hoje = new Date().toDateString()
        if (reg && reg.data === hoje) setRegistroHoje(reg)

        iniciarCamera()
        return () => { clearInterval(tick); pararCamera() }
    }, [])

    const iniciarCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
            streamRef.current = stream
            if (videoRef.current) videoRef.current.srcObject = stream
            setCameraAtiva(true)
        } catch {
            alert('Não foi possível acessar a câmera.')
        }
    }

    const pararCamera = () => {
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
        setCameraAtiva(false)
    }

    const capturar = () => {
        const v = videoRef.current, c = canvasRef.current
        if (!v || !c) return
        c.width = v.videoWidth; c.height = v.videoHeight
        c.getContext('2d').drawImage(v, 0, 0)
        setFoto(c.toDataURL('image/jpeg'))
        pararCamera()
    }

    const confirmar = async () => {
        if (!foto) return
        setEnviando(true)
        try {
            await new Promise(r => setTimeout(r, 1200))

            const agora = new Date()
            const horaStr = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            const hoje = agora.toDateString()

            // Atualiza registro de hoje com checkout
            const regAtual = JSON.parse(localStorage.getItem('registroHoje') || '{}')
            localStorage.setItem('registroHoje', JSON.stringify({ ...regAtual, data: hoje, checkout: horaStr, fotoCheckout: foto }))

            // Histórico geral
            const hist = JSON.parse(localStorage.getItem('historicoRegistros') || '[]')
            hist.unshift({ tipo: 'checkout', data: agora.toLocaleDateString('pt-BR'), hora: horaStr })
            localStorage.setItem('historicoRegistros', JSON.stringify(hist.slice(0, 20)))

            setSucesso(true)
        } catch {
            alert('Erro ao registrar. Tente novamente.')
        } finally {
            setEnviando(false)
        }
    }

    if (sucesso) {
        const reg = JSON.parse(localStorage.getItem('registroHoje') || '{}')
        return (
            <div className="sucesso-page">
                <div className="sucesso-icon" style={{ background: '#1c1000', border: '2px solid #f59e0b', color: '#f59e0b' }}>✓</div>
                <h2 className="sucesso-titulo" style={{ color: '#e8edf4' }}>Check-out realizado!</h2>
                <p className="sucesso-sub">Saída registrada com sucesso.</p>
                <p className="sucesso-hora">{hora}</p>

                {/* Resumo do dia */}
                <div style={s.resumoDia}>
                    <p style={s.resumoTitulo}>Resumo da jornada</p>
                    <div style={s.resumoGrid}>
                        <div style={s.resumoItem}>
                            <span style={s.resumoLabel}>Entrada</span>
                            <span style={{ ...s.resumoHora, color: '#22c55e' }}>{reg.checkin || '--:--'}</span>
                        </div>
                        <span style={s.resumoSeta}>→</span>
                        <div style={s.resumoItem}>
                            <span style={s.resumoLabel}>Saída</span>
                            <span style={{ ...s.resumoHora, color: '#f59e0b' }}>{reg.checkout || '--:--'}</span>
                        </div>
                    </div>
                </div>

                <div style={s.botoesPos}>
                    <button className="btn" style={{ background: '#14532d', color: '#22c55e', border: '1px solid #166534', width: '100%' }}
                        onClick={gerarRelatorioCSV}>
                        Baixar relatório do dia (CSV)
                    </button>
                    <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => navigate('/dashboard')}>
                        Voltar ao início
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div style={s.page}>
            <div style={s.header}>
                <button style={s.voltar} onClick={() => navigate('/dashboard')}>← Voltar</button>
                <span style={s.hora}>{hora}</span>
            </div>

            <div style={s.content}>
                <div style={s.tagBox}>
                    <span className="badge badge-amber">Saída</span>
                </div>
                <h2 style={s.titulo}>Check-out</h2>
                <p style={s.sub}>Registre o fim do seu expediente</p>

                {/* Mostra entrada se tiver */}
                {registroHoje?.checkin && (
                    <div style={s.entradaBox}>
                        <span style={s.entradaLabel}>Entrada registrada às</span>
                        <span style={s.entradaHora}>{registroHoje.checkin}</span>
                    </div>
                )}

                <div className="camera-area" style={{ marginBottom: '20px' }}>
                    <video ref={videoRef} autoPlay playsInline style={{ display: cameraAtiva ? 'block' : 'none', width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                    {foto && <img src={foto} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    {!cameraAtiva && !foto && (
                        <button className="btn btn-ghost" onClick={iniciarCamera}>Iniciar câmera</button>
                    )}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>

                {!foto ? (
                    cameraAtiva && <button className="btn btn-amber btn-full" style={{ fontSize: '16px', padding: '15px', color: '#000' }} onClick={capturar}>Tirar foto</button>
                ) : (
                    <div style={s.acoes}>
                        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setFoto(null); iniciarCamera() }}>Refazer</button>
                        <button className="btn btn-amber" style={{ flex: 2, fontSize: '15px', padding: '14px', color: '#000' }} onClick={confirmar} disabled={enviando}>
                            {enviando ? 'Enviando...' : '✓ Confirmar Saída'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

const s = {
    page: { minHeight: '100vh', background: '#0d1117', fontFamily: "'DM Sans', sans-serif", color: '#e8edf4' },
    header: { padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e2736' },
    voltar: { background: 'none', border: 'none', color: '#5a6a7e', fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
    hora: { fontFamily: "'DM Mono', monospace", fontSize: '14px', color: '#5a6a7e', background: '#161c26', padding: '4px 10px', borderRadius: '20px' },
    content: { padding: '28px 24px' },
    tagBox: { marginBottom: '10px' },
    titulo: { fontFamily: "'Syne', sans-serif", fontSize: '26px', fontWeight: '700', marginBottom: '6px' },
    sub: { color: '#5a6a7e', fontSize: '14px', marginBottom: '20px' },
    entradaBox: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a1f0a', border: '1px solid #14532d', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' },
    entradaLabel: { fontSize: '13px', color: '#5a6a7e' },
    entradaHora: { fontFamily: "'DM Mono', monospace", fontSize: '18px', color: '#22c55e', fontWeight: '500' },
    acoes: { display: 'flex', gap: '10px' },
    resumoDia: { background: '#161c26', border: '1px solid #263040', borderRadius: '12px', padding: '20px', margin: '20px 0', width: '100%', maxWidth: '320px' },
    resumoTitulo: { fontSize: '11px', color: '#5a6a7e', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '14px', textAlign: 'center' },
    resumoGrid: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' },
    resumoItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
    resumoLabel: { fontSize: '11px', color: '#5a6a7e' },
    resumoHora: { fontFamily: "'DM Mono', monospace", fontSize: '22px', fontWeight: '500' },
    resumoSeta: { color: '#263040', fontSize: '20px' },
    botoesPos: { display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '320px', marginTop: '8px' },
}