import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function RegistroPonto() {
    const navigate = useNavigate()
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)

    const [tipoRegistro, setTipoRegistro] = useState(null) // 'checkin' | 'checkout'
    const [fotoCapturada, setFotoCapturada] = useState(null)
    const [cameraAtiva, setCameraAtiva] = useState(false)
    const [enviando, setEnviando] = useState(false)
    const [sucesso, setSucesso] = useState(false)
    const [horaAtual, setHoraAtual] = useState('')
    const [registroHoje, setRegistroHoje] = useState(null)

    // Buscar registro de hoje ao carregar
    useEffect(() => {
        buscarRegistroHoje()
    }, [])

    // Buscar registro do dia atual
    const buscarRegistroHoje = async () => {
        try {
            const token = localStorage.getItem('token')
            // Simulação - substituir pela API real
            const response = await fetch('/api/ponto/hoje', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await response.json()
            setRegistroHoje(data)
            
            // Define qual tipo de registro deve ser feito
            if (!data.checkin) {
                setTipoRegistro('checkin')
                // Abre a câmera automaticamente para check-in
                setTimeout(() => iniciarCamera(), 500)
            } else if (data.checkin && !data.checkout) {
                setTipoRegistro('checkout')
            } else {
                setTipoRegistro(null)
            }
        } catch (error) {
            console.error('Erro ao buscar registro:', error)
            setTipoRegistro('checkin')
            setTimeout(() => iniciarCamera(), 500)
        }
    }

    // Atualizar hora atual
    useEffect(() => {
        const tick = setInterval(() => {
            setHoraAtual(new Date().toLocaleTimeString('pt-BR'))
        }, 1000)
        setHoraAtual(new Date().toLocaleTimeString('pt-BR'))
        return () => clearInterval(tick)
    }, [])

    // Inicia câmera
    const iniciarCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
            }
            setCameraAtiva(true)
        } catch (error) {
            console.error('Erro ao acessar câmera:', error)
            alert('Não foi possível acessar a câmera. Verifique as permissões.')
        }
    }

    // Para câmera
    const pararCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop())
            streamRef.current = null
        }
        setCameraAtiva(false)
    }

    // Captura foto da câmera
    const capturarFoto = () => {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas) return
        
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d').drawImage(video, 0, 0)
        const dataUrl = canvas.toDataURL('image/jpeg')
        setFotoCapturada(dataUrl)
        pararCamera()
    }

    // Refazer foto
    const refazer = () => {
        setFotoCapturada(null)
        iniciarCamera()
    }

    // Obter localização atual
    const getLocalizacao = () => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(null)
                return
            }
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        precisao: position.coords.accuracy
                    })
                },
                () => resolve(null)
            )
        })
    }

    // Enviar registro (checkin ou checkout)
    const enviarRegistro = async () => {
        if (!fotoCapturada || !tipoRegistro) return
        
        setEnviando(true)
        
        try {
            // Validar se ainda pode fazer o registro
            if (tipoRegistro === 'checkin' && registroHoje?.checkin) {
                alert('Check-in já realizado hoje!')
                navigate('/dashboard')
                return
            }
            
            if (tipoRegistro === 'checkout' && (!registroHoje?.checkin || registroHoje?.checkout)) {
                alert('Você precisa fazer check-in antes do check-out!')
                navigate('/dashboard')
                return
            }
            
            // Obter localização
            const localizacao = await getLocalizacao()
            
            // Preparar dados para envio
            const dados = {
                tipo: tipoRegistro,
                foto: fotoCapturada,
                horario: new Date().toISOString(),
                localizacao: localizacao,
                token: localStorage.getItem('token')
            }
            
            // Chamada real para API
            const endpoint = tipoRegistro === 'checkin' ? '/api/ponto/checkin' : '/api/ponto/checkout'
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(dados)
            })
            
            if (!response.ok) {
                throw new Error('Erro ao registrar ponto')
            }
            
            const resultado = await response.json()
            console.log(`${tipoRegistro} realizado:`, resultado)
            
            setSucesso(true)
            
            // Redirecionar após 2.5 segundos
            setTimeout(() => navigate('/dashboard'), 2500)
            
        } catch (error) {
            console.error('Erro:', error)
            alert(error.message || 'Erro ao enviar registro. Tente novamente.')
        } finally {
            setEnviando(false)
        }
    }

    // Se já completou a jornada hoje
    if (registroHoje?.checkin && registroHoje?.checkout) {
        return (
            <div className="rp-container">
                <div className="rp-header">
                    <button className="rp-voltar" onClick={() => navigate('/dashboard')}>← Voltar</button>
                    <span className="rp-hora">{horaAtual}</span>
                </div>
                <div className="rp-completo">
                    <div className="rp-completo-icone">✓✓</div>
                    <h2>Jornada finalizada!</h2>
                    <p>Você já realizou check-in e check-out hoje.</p>
                    <div className="rp-resumo">
                        <div className="rp-resumo-item">
                            <strong>Check-in:</strong> {new Date(registroHoje.checkin).toLocaleTimeString('pt-BR')}
                        </div>
                        <div className="rp-resumo-item">
                            <strong>Check-out:</strong> {new Date(registroHoje.checkout).toLocaleTimeString('pt-BR')}
                        </div>
                    </div>
                    <button className="rp-btn-voltar-dash" onClick={() => navigate('/dashboard')}>
                        Voltar ao Dashboard
                    </button>
                </div>
            </div>
        )
    }

    if (sucesso) {
        return (
            <div className="rp-sucesso">
                <div className="rp-sucesso-icone">✓</div>
                <h2>Registro realizado!</h2>
                <p>
                    {tipoRegistro === 'checkin' 
                        ? 'Check-in realizado com sucesso!' 
                        : 'Check-out realizado com sucesso!'}
                </p>
                <p className="rp-hora-registro">{horaAtual}</p>
                {tipoRegistro === 'checkin' && (
                    <p className="rp-proximo">Não se esqueça de fazer o check-out no final do expediente.</p>
                )}
            </div>
        )
    }

    // Se não tem tipo de registro
    if (!tipoRegistro) {
        return (
            <div className="rp-container">
                <div className="rp-header">
                    <button className="rp-voltar" onClick={() => navigate('/dashboard')}>← Voltar</button>
                    <span className="rp-hora">{horaAtual}</span>
                </div>
                <div className="rp-erro">
                    <h2>Nenhum registro pendente</h2>
                    <p>Você já completou sua jornada de hoje.</p>
                    <button className="rp-btn-voltar-dash" onClick={() => navigate('/dashboard')}>
                        Voltar ao Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="rp-container">
            <div className="rp-header">
                <button className="rp-voltar" onClick={() => navigate('/dashboard')}>← Voltar</button>
                <span className="rp-hora">{horaAtual}</span>
            </div>

            <h2 className="rp-titulo">
                {tipoRegistro === 'checkin' ? 'Check-in' : 'Check-out'}
            </h2>
            
            <p className="rp-subtitulo">
                {tipoRegistro === 'checkin' 
                    ? 'Registre o início do seu expediente' 
                    : 'Registre o fim do seu expediente'}
            </p>

            {/* Área da foto - apenas câmera */}
            <div className="rp-foto-area">
                {!fotoCapturada ? (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="rp-video"
                            style={{ display: cameraAtiva ? 'block' : 'none' }}
                        />
                        {!cameraAtiva && (
                            <button className="rp-btn-iniciar-camera" onClick={iniciarCamera}>
                                📷 Iniciar Câmera
                            </button>
                        )}
                        {cameraAtiva && (
                            <button className="rp-btn-capturar" onClick={capturarFoto}>
                                📸 Tirar Foto
                            </button>
                        )}
                    </>
                ) : (
                    <>
                        <img src={fotoCapturada} alt="Foto capturada" className="rp-preview" />
                        <div className="rp-acoes-confirmacao">
                            <button className="rp-btn-refazer" onClick={refazer}>
                                🔄 Refazer Foto
                            </button>
                            <button
                                className="rp-btn-confirmar"
                                onClick={enviarRegistro}
                                disabled={enviando}
                            >
                                {enviando 
                                    ? 'Enviando...' 
                                    : `✓ Confirmar ${tipoRegistro === 'checkin' ? 'Check-in' : 'Check-out'}`
                                }
                            </button>
                        </div>
                    </>
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
        </div>
    )
}