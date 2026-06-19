import { useNavigate } from 'react-router-dom'
import selo100Anos from '../assets/cbmsc-100-anos.svg'
import bombeirosLogo from '../assets/cbmsc-bombeiros.svg'
import '../global.css'

const MISSOES = [
  { icone: '🌊', titulo: 'Salvamento Aquático', texto: 'Vigilância e resgate em praias, rios e reservatórios de Santa Catarina, com equipes treinadas para atuar em qualquer condição.' },
  { icone: '🔥', titulo: 'Combate a Incêndios', texto: 'Prevenção e combate a incêndios urbanos, florestais e industriais, protegendo vidas e patrimônio em todo o estado.' },
  { icone: '🚑', titulo: 'Atendimento Pré-Hospitalar', texto: 'Primeiros socorros e suporte avançado de vida, com resposta rápida em emergências médicas e acidentes.' },
  { icone: '⛑️', titulo: 'Defesa Civil', texto: 'Atuação em desastres naturais, buscas e resgates em estruturas colapsadas e apoio à população em situações de risco.' },
]

const NUMEROS = [
  { valor: '100', unidade: 'anos', label: 'de história em SC' },
  { valor: '21', unidade: 'postos', label: 'de salva-vidas ativos' },
  { valor: '293', unidade: 'municípios', label: 'atendidos no estado' },
  { valor: '24h', unidade: '', label: 'de prontidão diária' },
]

export function Inicio() {
  const navigate = useNavigate()

  return (
    <div style={s.page}>

      {/* ── App Bar ── */}
      <header style={s.appbar}>
        <div style={s.appbarInner}>
          <div style={s.appbarBrand}>
            <img src={bombeirosLogo} alt="Corpo de Bombeiros Militar" style={s.appbarLogo} />
            <div>
              <p style={s.appbarTitle}>CBMSC</p>
              <p style={s.appbarSub}>Corpo de Bombeiros Militar de SC</p>
            </div>
          </div>
          <nav style={s.appbarNav}>
            <a
              href="https://portal.cbm.sc.gov.br/"
              target="_blank"
              rel="noopener noreferrer"
              style={s.navLink}
            >
              Portal CBMSC ↗
            </a>
            <button style={s.navBtnLogin} onClick={() => navigate('/login')}>
              Acessar Sistema
            </button>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={s.hero}>
        <div style={s.heroOverlay} />
        <div style={s.heroContent}>
          <p style={s.heroEyebrow}>Corpo de Bombeiros Militar de Santa Catarina</p>
          <h1 style={s.heroTitle}>
            PROTEGENDO<br />
            <span style={s.heroTitleGold}>VIDAS</span><br />
            HÁ 100 ANOS
          </h1>
          <p style={s.heroSub}>
            Uma corporação centenária dedicada ao salvamento, à prevenção e à resposta a emergências em todo o território catarinense.
          </p>
          <div style={s.heroBtns}>
            <button style={s.heroBtnPrimary} onClick={() => navigate('/login')}>
              Acessar Sistema de Ponto
            </button>
            <a
              href="https://portal.cbm.sc.gov.br/"
              target="_blank"
              rel="noopener noreferrer"
              style={s.heroBtnSecondary}
            >
              Conheça o CBMSC ↗
            </a>
          </div>
        </div>
        <div style={s.heroSeal}>
          <img src={selo100Anos} alt="CBMSC 100 anos" style={s.heroSealImg} />
        </div>
      </section>

      {/* ── Números ── */}
      <section style={s.numeros}>
        <div style={s.numerosInner}>
          {NUMEROS.map((n, i) => (
            <div key={i} style={s.numeroItem}>
              <div style={s.numeroValor}>
                <span style={s.numeroNum}>{n.valor}</span>
                {n.unidade && <span style={s.numeroUnidade}>{n.unidade}</span>}
              </div>
              <p style={s.numeroLabel}>{n.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sobre ── */}
      <section style={s.sobre}>
        <div style={s.sobreInner}>
          <div style={s.sobreTexto}>
            <p className="sec-label">Sobre a corporação</p>
            <h2 style={s.sobreTitle}>Uma força a serviço de Santa Catarina</h2>
            <p style={s.sobrePara}>
              O Corpo de Bombeiros Militar de Santa Catarina (CBMSC) é uma instituição militar estadual, integrante do Sistema de Segurança Pública, com missão constitucional de realizar atividades de defesa civil, prevenção e combate a incêndios, buscas, salvamentos e socorros públicos.
            </p>
            <p style={s.sobrePara}>
              Fundado em 1926, o CBMSC completa 100 anos de dedicação à população catarinense, com efetivo presente em todos os 293 municípios do estado, atuando 24 horas por dia, 365 dias por ano.
            </p>
            <p style={s.sobrePara}>
              O programa de salva-vidas é parte essencial desta missão, garantindo a segurança nas praias e corpos d'água de Santa Catarina durante toda a temporada, com profissionais treinados e postos estrategicamente distribuídos ao longo do litoral.
            </p>
            <a
              href="https://portal.cbm.sc.gov.br/"
              target="_blank"
              rel="noopener noreferrer"
              style={s.sobreLink}
            >
              Saiba mais no portal oficial ↗
            </a>
          </div>

          <div style={s.sobreCards}>
            {MISSOES.map((m, i) => (
              <div key={i} style={s.missaoCard}>
                <span style={s.missaoIcone}>{m.icone}</span>
                <div>
                  <p style={s.missaoTitulo}>{m.titulo}</p>
                  <p style={s.missaoTexto}>{m.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sistema ── */}
      <section style={s.sistema}>
        <div style={s.sistemaInner}>
          <div style={s.sistemaIcone}>⚑</div>
          <h2 style={s.sistemaTitle}>Sistema de Controle de Guarda-Bidas</h2>
          <p style={s.sistemaSub}>
            Plataforma oficial para registro de presença, controle de jornada e gestão dos 21 postos de salva-vidas do litoral catarinense.
          </p>
          <button style={s.sistemaBtnLogin} onClick={() => navigate('/login')}>
            Acessar Sistema
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div style={s.footerBrand}>
            <span style={{ color: '#c9a84c', fontSize: '20px' }}>⚑</span>
            <span style={s.footerBrandText}>CBMSC</span>
          </div>
          <p style={s.footerSub}>Corpo de Bombeiros Militar de Santa Catarina</p>
          <p style={s.footerSub}>
            <a href="https://portal.cbm.sc.gov.br/" target="_blank" rel="noopener noreferrer" style={{ color: '#c9a84c', textDecoration: 'none' }}>
              portal.cbm.sc.gov.br ↗
            </a>
          </p>
          <p style={{ ...s.footerSub, marginTop: '12px', color: '#1e3a60' }}>
            © {new Date().getFullYear()} CBMSC · Uso exclusivo de servidores autorizados
          </p>
        </div>
      </footer>

    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#0a1828', fontFamily: "'Barlow', sans-serif", color: '#e8eef5' },

  // App Bar
  appbar: { position: 'sticky', top: 0, zIndex: 100, background: '#0d2340', borderBottom: '2px solid #c9a84c' },
  appbarInner: { maxWidth: '1100px', margin: '0 auto', padding: '0 24px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  appbarBrand: { display: 'flex', alignItems: 'center', gap: '12px' },
  appbarLogo: { width: '42px', height: '42px', objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.25))' },
  appbarTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '16px', fontWeight: 700, letterSpacing: '3px', color: '#c9a84c', lineHeight: 1 },
  appbarSub: { fontFamily: "'Barlow', sans-serif", fontSize: '10px', color: '#6a8aaa', marginTop: '2px' },
  appbarNav: { display: 'flex', alignItems: 'center', gap: '12px' },
  navLink: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 600, letterSpacing: '1.5px', color: '#6a8aaa', textDecoration: 'none', textTransform: 'uppercase', transition: 'color .15s' },
  navBtnLogin: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', background: '#c9a84c', color: '#0a1828', border: 'none', borderRadius: '5px', padding: '8px 16px', cursor: 'pointer' },

  // Hero
  hero: { position: 'relative', minHeight: '92vh', background: 'linear-gradient(160deg, #060f1e 0%, #0d2340 40%, #112a4d 100%)', display: 'flex', alignItems: 'center', overflow: 'hidden' },
  heroOverlay: { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 50%, rgba(201,168,76,.06) 0%, transparent 60%)' },
  heroSeal: { position: 'absolute', right: 'clamp(-34px, 5vw, 92px)', top: '50%', transform: 'translateY(-48%)', width: 'clamp(220px, 29vw, 390px)', aspectRatio: '1', pointerEvents: 'none', opacity: 0.96, zIndex: 1 },
  heroSealImg: { width: '100%', height: '100%', objectFit: 'contain', display: 'block' },
  heroContent: { position: 'relative', zIndex: 2, maxWidth: '1100px', margin: '0 auto', padding: '80px 24px' },
  heroEyebrow: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 600, letterSpacing: '3px', color: '#c9a84c', textTransform: 'uppercase', marginBottom: '20px' },
  heroTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(52px, 9vw, 100px)', fontWeight: 700, letterSpacing: '4px', lineHeight: 0.95, color: '#f5f8fc', marginBottom: '28px' },
  heroTitleGold: { color: '#c9a84c' },
  heroSub: { fontFamily: "'Barlow', sans-serif", fontSize: '17px', color: '#8aa4c0', lineHeight: 1.7, maxWidth: '520px', marginBottom: '40px' },
  heroBtns: { display: 'flex', gap: '14px', flexWrap: 'wrap' },
  heroBtnPrimary: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', background: '#c9a84c', color: '#0a1828', border: 'none', borderRadius: '6px', padding: '14px 28px', cursor: 'pointer', transition: 'filter .15s' },
  heroBtnSecondary: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', background: 'transparent', color: '#c9a84c', border: '1px solid #c9a84c', borderRadius: '6px', padding: '14px 28px', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' },

  // Números
  numeros: { background: '#0d2340', borderTop: '1px solid #1a3358', borderBottom: '1px solid #1a3358' },
  numerosInner: { maxWidth: '1100px', margin: '0 auto', padding: '40px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0' },
  numeroItem: { padding: '20px 24px', borderRight: '1px solid #1a3358', textAlign: 'center' },
  numeroValor: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px', marginBottom: '6px' },
  numeroNum: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '40px', fontWeight: 700, color: '#c9a84c', lineHeight: 1 },
  numeroUnidade: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '16px', fontWeight: 600, color: '#6a8aaa', letterSpacing: '1px' },
  numeroLabel: { fontFamily: "'Barlow', sans-serif", fontSize: '12px', color: '#6a8aaa' },

  // Sobre
  sobre: { padding: '80px 0', background: '#0a1828' },
  sobreInner: { maxWidth: '1100px', margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'start' },
  sobreTexto: {},
  sobreTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '36px', fontWeight: 700, letterSpacing: '1px', color: '#f5f8fc', lineHeight: 1.15, marginBottom: '20px' },
  sobrePara: { fontFamily: "'Barlow', sans-serif", fontSize: '15px', color: '#8aa4c0', lineHeight: 1.8, marginBottom: '16px' },
  sobreLink: { display: 'inline-block', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#c9a84c', textDecoration: 'none', marginTop: '8px', borderBottom: '1px solid rgba(201,168,76,.3)', paddingBottom: '2px' },
  sobreCards: { display: 'flex', flexDirection: 'column', gap: '12px' },
  missaoCard: { background: '#112a4d', border: '1px solid #1a3358', borderLeft: '3px solid #c9a84c', borderRadius: '6px', padding: '16px 18px', display: 'flex', gap: '14px', alignItems: 'flex-start' },
  missaoIcone: { fontSize: '22px', flexShrink: 0, lineHeight: 1, marginTop: '2px' },
  missaoTitulo: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px', fontWeight: 700, letterSpacing: '1px', color: '#e8eef5', textTransform: 'uppercase', marginBottom: '4px' },
  missaoTexto: { fontFamily: "'Barlow', sans-serif", fontSize: '13px', color: '#6a8aaa', lineHeight: 1.6 },

  // CTA Sistema
  sistema: { padding: '80px 24px', background: 'linear-gradient(135deg, #0d2340 0%, #112a4d 100%)', borderTop: '1px solid #1a3358', textAlign: 'center' },
  sistemaInner: { maxWidth: '560px', margin: '0 auto' },
  sistemaIcone: { fontSize: '40px', color: '#c9a84c', marginBottom: '16px', display: 'block' },
  sistemaTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '32px', fontWeight: 700, letterSpacing: '2px', color: '#f5f8fc', marginBottom: '14px' },
  sistemaSub: { fontFamily: "'Barlow', sans-serif", fontSize: '15px', color: '#8aa4c0', lineHeight: 1.7, marginBottom: '32px' },
  sistemaBtnLogin: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '15px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', background: '#c9a84c', color: '#0a1828', border: 'none', borderRadius: '6px', padding: '16px 40px', cursor: 'pointer' },

  // Footer
  footer: { background: '#060d18', borderTop: '1px solid #1a3358', padding: '40px 24px', textAlign: 'center' },
  footerInner: { maxWidth: '1100px', margin: '0 auto' },
  footerBrand: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' },
  footerBrandText: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '18px', fontWeight: 700, letterSpacing: '3px', color: '#c9a84c' },
  footerSub: { fontFamily: "'Barlow', sans-serif", fontSize: '12px', color: '#2a4a72', marginTop: '4px' },
}
