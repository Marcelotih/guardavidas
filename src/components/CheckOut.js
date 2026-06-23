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

// Etapas: 'form' → 'camera' → 'preview' → (envio)
export function CheckOut() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [etapa, setEtapa] = useState('form')
  const [posto, setPosto] = useState(searchParams.get('posto') || '')
  const [foto, setFoto] = useState(null)
  const [fotoArquivo, setFotoArquivo] = useState(null)
  const [relatorio, setRelatorio] = useState(relatorioInicial)
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [hora, setHora] = useState('')
  const [stream, setStream] = useState(null)
  const [erroCamera, setErroCamera] = useState('')
  const nome = localStorage.getItem('nomeUsuario') || 'Salva-vidas'

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return }
    if (!searchParams.get('posto')) {
      api.get('/check/registros/hoje')
        .then(data => {
          const checkinHoje = data.find(r => r.tipo === 'checkin')
          if (checkinHoje?.postoId) setPosto(String(checkinHoje.postoId))
        })
        .catch(err => console.error('Erro ao carregar check-in de hoje:', err))
    }
    const tick = setInterval(() => setHora(new Date().toLocaleTimeString('pt-BR')), 1000)
    setHora(new Date().toLocaleTimeString('pt-BR'))
    return () => clearInterval(tick)
  }, [navigate, searchParams])

  useEffect(() => {
    if (etapa !== 'camera' && stream) {
      stream.getTracks().forEach(t => t.stop())
      setStream(null)
    }
  }, [etapa, stream])

  const abrirCamera = async () => {
    setErroCamera('')
    setEtapa('camera')
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
        setStream(mediaStream)
      }
    } catch (err) {
      setErroCamera('Não foi possível acessar a câmera. Verifique as permissões do navegador.')
      console.error(err)
    }
  }

  const capturarFoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(blob => {
      if (blob) {
        setFotoArquivo(new File([blob], 'foto-checkout.jpg', { type: 'image/jpeg' }))
        setFoto(canvas.toDataURL('image/jpeg'))
        setEtapa('preview')
      }
    }, 'image/jpeg', 0.92)
  }

  const retirarFoto = () => {
    setFoto(null)
    setFotoArquivo(null)
    abrirCamera()
  }

  const voltarForm = () => {
    setFoto(null)
    setFotoArquivo(null)
    setEtapa('form')
  }

  const atualizarRelatorio = (turno, campo, valor) => {
    const normalizado = valor === '' ? '' : String(Math.max(0, Number(valor) || 0))
    setRelatorio(atual => ({ ...atual, [turno]: { ...atual[turno], [campo]: normalizado } }))
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

  // ── Sucesso ──
  if (sucesso) return (
    <div className="sucesso-wrap">
      <div className="sucesso-icon">✓</div>
      <h2 className="sucesso-h">CHECK-OUT<br />REALIZADO</h2>
      <p className="sucesso-hora">{hora}</p>
      <p className="sucesso-sub">{formatPosto(posto)}</p>
    </div>
  )

  // ── Câmera fullscreen ──
  if (etapa === 'camera') return (
    <div style={c.camWrap}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={c.camHeader}>
        <button style={c.camBack} onClick={voltarForm}>← Voltar</button>
        <span style={c.camTitulo}>FOTO DE SAÍDA</span>
        <span style={c.camHora}>{hora}</span>
      </div>

      <div style={c.viewfinder}>
        {erroCamera ? (
          <div style={c.erroWrap}>
            <span style={{ fontSize: '40px', marginBottom: '16px' }}>📷</span>
            <p style={c.erroTxt}>{erroCamera}</p>
            <button className="btn btn-navy" style={{ marginTop: '20px' }} onClick={abrirCamera}>
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            <video ref={videoRef} style={c.video} autoPlay playsInline muted />
            <div style={c.ovalGuia} />
            <p style={c.guiaTxt}>Posicione seu rosto no oval</p>
          </>
        )}
      </div>

      <div style={c.camFooter}>
        <div style={c.camBtnWrap}>
          <button style={c.btnCapturar} onClick={capturarFoto} disabled={!!erroCamera}>
            <div style={c.btnCapturarInner} />
          </button>
        </div>
        <p style={c.camDica}>Toque no botão para tirar a foto</p>
      </div>
    </div>
  )

  // ── Preview da foto ──
  if (etapa === 'preview') return (
    <div style={c.prevWrap}>
      <div style={c.camHeader}>
        <button style={c.camBack} onClick={retirarFoto}>← Tirar outra</button>
        <span style={c.camTitulo}>CONFIRMAR FOTO</span>
        <span style={c.camHora}>{hora}</span>
      </div>

      <div style={c.prevFotoWrap}>
        <img src={foto} alt="Foto capturada" style={c.prevFoto} />
        <div style={c.prevOverlay}>
          <span className="badge badge-gold" style={{ fontSize: '12px', padding: '5px 12px' }}>
            Foto capturada
          </span>
        </div>
      </div>

      <div style={c.prevInfo}>
        <div style={c.prevInfoRow}>
          <span style={c.prevInfoLabel}>Usuário</span>
          <span style={c.prevInfoVal}>{nome}</span>
        </div>
        <div style={c.prevInfoRow}>
          <span style={c.prevInfoLabel}>Posto</span>
          <span style={c.prevInfoVal}>{formatPosto(posto)}</span>
        </div>
        <div style={c.prevInfoRow}>
          <span style={c.prevInfoLabel}>Hora</span>
          <span style={{ ...c.prevInfoVal, fontFamily: "'DM Mono', monospace", color: '#c9a84c' }}>{hora}</span>
        </div>
      </div>

      <div style={c.prevAcoes}>
        <button className="btn btn-ghost" style={{ flex: 1, fontSize: '13px' }} onClick={retirarFoto}>
           Tirar outra
        </button>
        <button
          className="btn btn-navy"
          style={{ flex: 2, fontSize: '14px', letterSpacing: '1.5px' }}
          onClick={voltarForm}
        >
          Usar esta foto ✓
        </button>
      </div>
    </div>
  )

  // ── Formulário ──
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

        {/* Relatório */}
        <div style={s.field}>
          <label style={s.label}>Relatório do check-out</label>
          <div style={s.turnosGrid}>
            <div style={{ ...s.turnoCard, borderLeftColor: '#c9a84c' }}>
              <p style={{ ...s.turnoTitulo, color: '#c9a84c' }}>Turno Matutino</p>
              <div style={s.inputsGrid}>
                <label style={s.inputLabel}>
                  Prevenções
                  <input className="input" type="number" min="0" inputMode="numeric" placeholder="0"
                    value={relatorio.matutino.prevencoes}
                    onChange={e => atualizarRelatorio('matutino', 'prevencoes', e.target.value)} />
                </label>
                <label style={s.inputLabel}>
                  Incidentes
                  <input className="input" type="number" min="0" inputMode="numeric" placeholder="0"
                    value={relatorio.matutino.incidentes}
                    onChange={e => atualizarRelatorio('matutino', 'incidentes', e.target.value)} />
                </label>
              </div>
            </div>

            <div style={{ ...s.turnoCard, borderLeftColor: '#2a63d8' }}>
              <p style={{ ...s.turnoTitulo, color: '#8aa7ff' }}>Turno Vespertino</p>
              <div style={s.inputsGrid}>
                <label style={s.inputLabel}>
                  Prevenções
                  <input className="input" type="number" min="0" inputMode="numeric" placeholder="0"
                    value={relatorio.vespertino.prevencoes}
                    onChange={e => atualizarRelatorio('vespertino', 'prevencoes', e.target.value)} />
                </label>
                <label style={s.inputLabel}>
                  Incidentes
                  <input className="input" type="number" min="0" inputMode="numeric" placeholder="0"
                    value={relatorio.vespertino.incidentes}
                    onChange={e => atualizarRelatorio('vespertino', 'incidentes', e.target.value)} />
                </label>
              </div>
            </div>
          </div>

          <div style={s.fieldCompact}>
            <label style={s.inputLabel}>
              Lesões por água-viva
              <input className="input" type="number" min="0" inputMode="numeric" placeholder="0"
                value={relatorio.lesoesAguaViva}
                onChange={e => atualizarLesoes(e.target.value)} />
            </label>
          </div>

          <div style={s.totalBox}>
            <span style={s.totalLabel}>Total geral</span>
            <strong style={s.totalNumero}>{totalGeral}</strong>
            <span style={s.totalSub}>Matutino: {totalMatutino} · Vespertino: {totalVespertino}</span>
          </div>
        </div>

        {/* Foto */}
        <div style={s.field}>
          <label style={s.label}>Foto obrigatória</label>

          {!foto ? (
            <button
              className="btn btn-navy btn-full"
              style={s.btnFoto}
              onClick={abrirCamera}
              disabled={!posto}
            >
              <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>📸</span>
              {posto ? 'Abrir câmera e tirar foto' : 'Selecione o posto primeiro'}
            </button>
          ) : (
            <div style={s.fotoOkWrap}>
              <img src={foto} alt="Foto" style={s.fotoThumb} />
              <div style={s.fotoOkInfo}>
                <span className="badge badge-gold">Foto OK ✓</span>
                <button className="btn btn-ghost" style={{ fontSize: '12px', padding: '6px 12px', marginTop: '8px' }} onClick={retirarFoto}>
                  Trocar foto
                </button>
              </div>
            </div>
          )}
        </div>

        <button className="btn btn-navy btn-full" style={s.btnConfirm} onClick={confirmar} disabled={!posto || !fotoArquivo || enviando}>
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
  btnFoto: { padding: '32px 20px', fontSize: '14px', letterSpacing: '1.5px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: '12px' },
  fotoOkWrap: { display: 'flex', alignItems: 'center', gap: '16px', background: '#1a2e10', border: '1px solid #3a5010', borderRadius: '10px', padding: '14px' },
  fotoThumb: { width: '72px', height: '72px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: '2px solid #c9a84c' },
  fotoOkInfo: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
  btnConfirm: { fontSize: '15px', padding: '15px', letterSpacing: '2px', marginTop: '4px' },
}

const c = {
  camWrap: { minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column' },
  camHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'rgba(0,0,0,0.85)', borderBottom: '1px solid #1a3358', zIndex: 10, flexShrink: 0 },
  camBack: { background: 'none', border: '1px solid #2a4a72', borderRadius: '6px', color: '#6a8aaa', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 600, letterSpacing: '1px', padding: '6px 12px', cursor: 'pointer' },
  camTitulo: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px', fontWeight: 700, letterSpacing: '3px', color: '#c9a84c', textTransform: 'uppercase' },
  camHora: { fontFamily: "'DM Mono', monospace", fontSize: '13px', color: '#6a8aaa', background: '#0d2340', padding: '4px 10px', borderRadius: '4px', border: '1px solid #1a3358' },
  viewfinder: { flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#060d18' },
  video: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  ovalGuia: { position: 'absolute', width: '200px', height: '260px', border: '3px solid rgba(201,168,76,0.7)', borderRadius: '50%', boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)', pointerEvents: 'none' },
  guiaTxt: { position: 'absolute', bottom: '16px', left: 0, right: 0, textAlign: 'center', fontFamily: "'Barlow', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.5px' },
  erroWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 32px', textAlign: 'center' },
  erroTxt: { fontFamily: "'Barlow', sans-serif", fontSize: '15px', color: '#e05252', lineHeight: 1.6 },
  camFooter: { background: 'rgba(0,0,0,0.9)', padding: '24px 20px 32px', flexShrink: 0, borderTop: '1px solid #1a3358' },
  camBtnWrap: { display: 'flex', justifyContent: 'center', marginBottom: '12px' },
  btnCapturar: { width: '72px', height: '72px', borderRadius: '50%', border: '4px solid #c9a84c', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform .1s' },
  btnCapturarInner: { width: '52px', height: '52px', borderRadius: '50%', background: '#c9a84c' },
  camDica: { textAlign: 'center', fontFamily: "'Barlow', sans-serif", fontSize: '12px', color: '#6a8aaa', letterSpacing: '0.5px' },
  prevWrap: { minHeight: '100vh', background: '#0a1828', display: 'flex', flexDirection: 'column' },
  prevFotoWrap: { position: 'relative', flex: 1, background: '#000', overflow: 'hidden', minHeight: '300px' },
  prevFoto: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  prevOverlay: { position: 'absolute', top: '16px', left: 0, right: 0, display: 'flex', justifyContent: 'center' },
  prevInfo: { background: '#112a4d', borderTop: '2px solid #c9a84c', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' },
  prevInfoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  prevInfoLabel: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#6a8aaa' },
  prevInfoVal: { fontFamily: "'Barlow', sans-serif", fontSize: '14px', color: '#e8eef5', fontWeight: 500 },
  prevAcoes: { display: 'flex', gap: '10px', padding: '16px 20px 28px', background: '#0d2340', borderTop: '1px solid #1a3358', flexShrink: 0 },
}