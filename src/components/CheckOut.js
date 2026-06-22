import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { POSTOS, formatPosto } from '../postos'
import { api } from '../api'
import '../global.css'

const relatorioInicial = {
  matutino: { prevencoes: '', incidentes: '' },
  vespertino: { prevencoes: '', incidentes: '' },
  lesoesAguaViva: '',
}

const numero = valor => Number(valor) || 0

export function CheckOut() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [posto, setPosto] = useState(searchParams.get('posto') || '')
  const [foto, setFoto] = useState(null)
  const [fotoArquivo, setFotoArquivo] = useState(null)
  const [relatorio, setRelatorio] = useState(relatorioInicial)
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [hora, setHora] = useState('')
  const [cameraAtiva, setCameraAtiva] = useState(false)
  const [stream, setStream] = useState(null)
  const nome = localStorage.getItem('nomeUsuario') || 'Salva-vidas'

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return }
    if (!searchParams.get('posto')) {
      api.get('/check/registros/hoje')
        .then(data => {
          const checkinHoje = data.find(r => r.tipo === 'checkin')
          if (checkinHoje && checkinHoje.postoId) {
            setPosto(String(checkinHoje.postoId))
          }
        })
        .catch(err => console.error('Erro ao carregar check-in de hoje:', err))
    }
    const tick = setInterval(() => setHora(new Date().toLocaleTimeString('pt-BR')), 1000)
    setHora(new Date().toLocaleTimeString('pt-BR'))
    return () => clearInterval(tick)
  }, [navigate, nome, searchParams])

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
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'foto-checkout.jpg', { type: 'image/jpeg' })
          setFotoArquivo(file)
          setFoto(canvas.toDataURL('image/jpeg'))
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

  const atualizarRelatorio = (turno, campo, valor) => {
    const normalizado = valor === '' ? '' : String(Math.max(0, Number(valor) || 0))
    setRelatorio(atual => ({
      ...atual,
      [turno]: {
        ...atual[turno],
        [campo]: normalizado,
      },
    }))
  }

  const atualizarLesoes = valor => {
    const normalizado = valor === '' ? '' : String(Math.max(0, Number(valor) || 0))
    setRelatorio(atual => ({ ...atual, lesoesAguaViva: normalizado }))
  }

  const totalMatutino = numero(relatorio.matutino.prevencoes) + numero(relatorio.matutino.incidentes)
  const totalVespertino = numero(relatorio.vespertino.prevencoes) + numero(relatorio.vespertino.incidentes)
  const totalGeral = totalMatutino + totalVespertino + numero(relatorio.lesoesAguaViva)

  const confirmar = async () => {
    if (!posto || !fotoArquivo) return
    setEnviando(true)
    try {
      const formData = new FormData()
      formData.append('postoId', Number(posto))
      formData.append('foto', fotoArquivo)
      formData.append('matutinoPrevencoes', numero(relatorio.matutino.prevencoes))
      formData.append('matutinoIncidentes', numero(relatorio.matutino.incidentes))
      formData.append('vespertinoPrevencoes', numero(relatorio.vespertino.prevencoes))
      formData.append('vespertinoIncidentes', numero(relatorio.vespertino.incidentes))
      formData.append('lesoesAguaViva', numero(relatorio.lesoesAguaViva))

      await api.post('/check/out', formData)

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
      <h2 className="sucesso-h">CHECK-OUT<br />REALIZADO</h2>
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
        <span className="badge badge-gold" style={{ marginBottom: '12px' }}>Registro de Saída</span>
        <h2 style={s.titulo}>CHECK-OUT</h2>
        <div className="gold-line" />

        <div style={s.field}>
          <label style={s.label}>Posto de serviço</label>
          <select className="select" value={posto} onChange={e => setPosto(e.target.value)}>
            <option value="">Selecione o posto...</option>
            {POSTOS.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>

        <div style={s.field}>
          <label style={s.label}>Relatório do check-out</label>
          <div style={s.turnosGrid}>
            <div style={{ ...s.turnoCard, borderLeftColor: '#c9a84c' }}>
              <p style={{ ...s.turnoTitulo, color: '#c9a84c' }}>Turno Matutino</p>
              <div style={s.inputsGrid}>
                <label style={s.inputLabel}>
                  Prevenções
                  <input
                    className="input"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="0"
                    value={relatorio.matutino.prevencoes}
                    onChange={e => atualizarRelatorio('matutino', 'prevencoes', e.target.value)}
                  />
                </label>
                <label style={s.inputLabel}>
                  Incidentes
                  <input
                    className="input"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="0"
                    value={relatorio.matutino.incidentes}
                    onChange={e => atualizarRelatorio('matutino', 'incidentes', e.target.value)}
                  />
                </label>
              </div>
            </div>

            <div style={{ ...s.turnoCard, borderLeftColor: '#2a63d8' }}>
              <p style={{ ...s.turnoTitulo, color: '#8aa7ff' }}>Turno Vespertino</p>
              <div style={s.inputsGrid}>
                <label style={s.inputLabel}>
                  Prevenções
                  <input
                    className="input"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="0"
                    value={relatorio.vespertino.prevencoes}
                    onChange={e => atualizarRelatorio('vespertino', 'prevencoes', e.target.value)}
                  />
                </label>
                <label style={s.inputLabel}>
                  Incidentes
                  <input
                    className="input"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="0"
                    value={relatorio.vespertino.incidentes}
                    onChange={e => atualizarRelatorio('vespertino', 'incidentes', e.target.value)}
                  />
                </label>
              </div>
            </div>
          </div>

          <div style={s.fieldCompact}>
            <label style={s.inputLabel}>
              Lesões por água-viva
              <input
                className="input"
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="0"
                value={relatorio.lesoesAguaViva}
                onChange={e => atualizarLesoes(e.target.value)}
              />
            </label>
          </div>

          <div style={s.totalBox}>
            <span style={s.totalLabel}>Total geral</span>
            <strong style={s.totalNumero}>{totalGeral}</strong>
            <span style={s.totalSub}>Matutino: {totalMatutino} · Vespertino: {totalVespertino}</span>
          </div>
        </div>

        <div style={s.field}>
          <label style={s.label}>Foto obrigatória</label>
          <div style={s.fotoContainer}>
            {!foto && !cameraAtiva && (
              <button 
                className="btn btn-navy btn-full" 
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
                  <button className="btn btn-navy" onClick={capturarFoto}>
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
                  <button className="btn btn-navy" onClick={() => {}}>
                    Foto OK ✓
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <button className="btn btn-navy btn-full" style={s.btnConfirm} onClick={confirmar} disabled={!posto || !foto || enviando}>
          {enviando ? 'Registrando...' : 'Registrar Check-out'}
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
  turnosGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '14px' },
  turnoCard: { background: '#112a4d', border: '1px solid #1a3358', borderLeft: '3px solid #c9a84c', borderRadius: '8px', padding: '14px' },
  turnoTitulo: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '15px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' },
  inputsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  inputLabel: { display: 'flex', flexDirection: 'column', gap: '7px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#e8eef5' },
  fieldCompact: { marginBottom: '14px' },
  totalBox: { background: 'linear-gradient(100deg, #0f7f95, #1d56c9)', borderRadius: '8px', padding: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', boxShadow: '0 10px 24px rgba(0,0,0,.22)' },
  totalLabel: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px', fontWeight: 700, letterSpacing: '1px', color: '#f5f8fc' },
  totalNumero: { fontFamily: "'DM Mono', monospace", fontSize: '40px', lineHeight: 1, color: '#fff' },
  totalSub: { fontFamily: "'Barlow', sans-serif", fontSize: '12px', color: '#dce8ff' },
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