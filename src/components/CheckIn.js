import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../global.css'

export function CheckIn() {
    const navigate = useNavigate()
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)

    const [foto, setFoto] = useState(null)
    const [cameraAtiva, setCameraAtiva] = useState(false)
    const [enviando, setEnviando] = useState(false)
    const [sucesso, setSucesso] = useState(false)
    const [hora, setHora] = useState('')

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) { navigate('/login'); return }
        const tick = setInterval(() => setHora(new Date().toLocaleTimeString('pt-BR')), 1000)
        setHora(new Date().toLocaleTimeString('pt-BR'))
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
            // Simula envio — substitua pela API real
            await new Promise(r => setTimeout(r, 1200))

            const agora = new Date()
            const horaStr = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

            // Salva registro de hoje
            const hoje = agora.toDateString()
            const regAtual = JSON.parse(localStorage.getItem('registroHoje') || '{}')
            localStorage.setItem('registroHoje', JSON.stringify({ ...regAtual, data: hoje, checkin: horaStr, fotoCheckin: foto }))

            // Histórico geral
            const hist = JSON.parse(localStorage.getItem('historicoRegistros') || '[]')
            hist.unshift({ tipo: 'checkin', data: agora.toLocaleDateString('pt-BR'), hora: horaStr })
            localStorage.setItem('historicoRegistros', JSON.stringify(hist.slice(0, 20)))

            setSucesso(true)
            setTimeout(() => navigate('/dashboard'), 2500)
        } catch {
            alert('Erro ao registrar. Tente novamente.')
        } finally {
            setEnviando(false)
        }
    }

    if (sucesso) return (
        <div className="sucesso-page">
            <div className="sucesso-icon" style={{ background: '#0a1f0a', border: '2px solid #22c55e', color: '#22c55e' }}>✓</div>
            <h2 className="sucesso-titulo" style={{ color: '#e8edf4' }}>Check-in realizado!</h2>
            <p className="sucesso-sub">Entrada registrada com sucesso.</p>
            <p className="sucesso-hora">{hora}</p>
            <p className="sucesso-sub">Não esqueça de registrar a saída no final do expediente.</p>
        </div>
    )

    return (
        <div style={s.page}>
            <div style={s.header}>
                <button style={s.voltar} onClick={() => navigate('/dashboard')}>← Voltar</button>
                <span style={s.hora}>{hora}</span>
            </div>

            <div style={s.content}>
                <div style={s.tagBox}>
                    <span className="badge badge-green">Entrada</span>
                </div>
                <h2 style={s.titulo}>Check-in</h2>
                <p style={s.sub}>Registre o início do seu expediente</p>

                <div className="camera-area" style={{ marginBottom: '20px' }}>
                    <video ref={videoRef} autoPlay playsInline style={{ display: cameraAtiva ? 'block' : 'none', width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                    {foto && <img src={foto} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    {!cameraAtiva && !foto && (
                        <button className="btn btn-ghost" onClick={iniciarCamera}>Iniciar câmera</button>
                    )}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>

                {!foto ? (
                    cameraAtiva && <button className="btn btn-primary btn-full" style={{ fontSize: '16px', padding: '15px' }} onClick={capturar}>Tirar foto</button>
                ) : (
                    <div style={s.acoes}>
                        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setFoto(null); iniciarCamera() }}>Refazer</button>
                        <button className="btn btn-primary" style={{ flex: 2, fontSize: '15px', padding: '14px' }} onClick={confirmar} disabled={enviando}>
                            {enviando ? 'Enviando...' : '✓ Confirmar Entrada'}
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
    sub: { color: '#5a6a7e', fontSize: '14px', marginBottom: '24px' },
    acoes: { display: 'flex', gap: '10px' },
}