import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { POSTOS, formatPosto } from '../postos'
import { api } from '../api'
import '../global.css'

export function CheckIn() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [posto, setPosto] = useState(searchParams.get('posto') || '')
  const nomePadrao = localStorage.getItem('nomeUsuario') || 'Salva-vidas'
  const [nomeRegistro, setNomeRegistro] = useState(nomePadrao === 'Salva-vidas' ? '' : nomePadrao)
  const [foto, setFoto] = useState(null)
  const [fotoArquivo, setFotoArquivo] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [hora, setHora] = useState('')
  const [cameraAtiva, setCameraAtiva] = useState(false)
  const [stream, setStream] = useState(null)

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return }
    const tick = setInterval(() => setHora(new Date().toLocaleTimeString('pt-BR')), 1000)
    setHora(new Date().toLocaleTimeString('pt-BR'))
    return () => clearInterval(tick)
  }, [navigate])

  const iniciarCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
        setStream(mediaStream)
        setCameraAtiva(true)
      }
    } catch (err) {
      alert('Não foi possível acessar a câmera. Verifique as permissões.')
      console.error(err)
    }
  }

  const capturarFoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Converter para blob
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'foto-checkin.jpg', { type: 'image/jpeg' })
          setFotoArquivo(file)
          setFoto(canvas.toDataURL('image/jpeg'))
          
          // Parar a câmera após capturar
          pararCamera()
        }
      }, 'image/jpeg', 0.9)
    }
  }

  const pararCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setCameraAtiva(false)
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const reiniciarCamera = () => {
    setFoto(null)
    setFotoArquivo(null)
    iniciarCamera()
  }

  const confirmar = async () => {
    if (!posto || !fotoArquivo) return
    setEnviando(true)
    try {
      const formData = new FormData()
      formData.append('postoId', Number(posto))
      formData.append('foto', fotoArquivo)
      if (nomeRegistro.trim()) {
        formData.append('nome', nomeRegistro.trim())
      }

      await api.post('/check/in', formData)

      setSucesso(true)
      setTimeout(() => navigate('/dashboard'), 2500)
    } catch (err) {
      alert(err.message || 'Erro ao registrar. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  if (sucesso) return (
    <div className="sucesso-wrap">
      <div className="sucesso-icon">✓</div>
      <h2 className="sucesso-h">CHECK-IN<br />REALIZADO</h2>
      <p className="sucesso-hora">{hora}</p>
      <p className="sucesso-sub">{formatPosto(posto)}</p>
    </div>
  )

  return (
    <div className="page">
      <div className="topbar">
        <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={() => navigate('/dashboard')}>← Voltar</button>
        <span className="topbar-hora">{hora}</span>
      </div>

      <div style={s.content}>
        <span className="badge badge-green" style={{ marginBottom: '12px' }}>Registro de Entrada</span>
        <h2 style={s.titulo}>CHECK-IN</h2>
        <div className="gold-line" />

        <div style={s.field}>
          <label style={s.label}>Nome do usuário (opcional)</label>
          <input
            className="input"
            type="text"
            placeholder="Usar nome do login"
            value={nomeRegistro}
            onChange={e => setNomeRegistro(e.target.value)}
          />
        </div>

        <div style={s.field}>
          <label style={s.label}>Posto de serviço</label>
          <select className="select" value={posto} onChange={e => setPosto(e.target.value)}>
            <option value="">Selecione o posto...</option>
            {POSTOS.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>

        <div style={s.field}>
          <label style={s.label}>Foto de identificação</label>
          <div style={s.fotoContainer}>
            {!foto && !cameraAtiva && (
              <button 
                className="btn btn-gold btn-full" 
                onClick={iniciarCamera}
                style={{ padding: '40px 20px', fontSize: '16px' }}
              >
                📸 Iniciar Câmera
              </button>
            )}
            
            {cameraAtiva && !foto && (
              <div style={s.cameraPreview}>
                <video 
                  ref={videoRef} 
                  style={s.video}
                  autoPlay 
                  playsInline
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div style={s.cameraControls}>
                  <button className="btn btn-ghost" onClick={pararCamera}>
                    Cancelar
                  </button>
                  <button className="btn btn-gold" onClick={capturarFoto}>
                    Capturar
                  </button>
                </div>
              </div>
            )}
            
            {foto && (
              <div style={s.fotoPreview}>
                <img src={foto} alt="Foto capturada" style={s.fotoImg} />
                <div style={s.cameraControls}>
                  <button className="btn btn-ghost" onClick={reiniciarCamera}>
                    Tirar outra
                  </button>
                  <button className="btn btn-gold" onClick={() => {}}>
                    Foto OK ✓
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <button 
          className="btn btn-gold btn-full" 
          style={s.btnConfirm} 
          onClick={confirmar} 
          disabled={!posto || !foto || enviando}
        >
          {enviando ? 'Registrando...' : 'Confirmar Entrada'}
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
  fotoContainer: { 
    border: '1px solid rgba(201, 168, 76, 0.3)',
    borderRadius: '12px',
    overflow: 'hidden',
    background: 'rgba(0,0,0,0.3)'
  },
  cameraPreview: {
    position: 'relative',
    width: '100%'
  },
  video: {
    width: '100%',
    display: 'block',
    background: '#000'
  },
  cameraControls: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.5)'
  },
  fotoPreview: {
    padding: '16px'
  },
  fotoImg: {
    width: '100%',
    borderRadius: '8px',
    marginBottom: '12px'
  },
  btnConfirm: { fontSize: '15px', padding: '15px', letterSpacing: '2px', marginTop: '4px' },
}