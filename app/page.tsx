import Link from 'next/link'

export default function LandingPage() {
  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <div className="logo">FIT<span>PLAN</span></div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/login" className="btn btn-ghost btn-sm">Entrar</Link>
            <Link href="/register" className="btn btn-primary btn-sm">Criar conta grátis</Link>
          </div>
        </div>
      </header>

      <div className="container" style={{ maxWidth: '820px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', padding: '60px 0 40px' }}>
          <div className="section-label" style={{ justifyContent: 'center', marginBottom: '16px' }}>
            Para Personal Trainers
          </div>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(3rem, 8vw, 6rem)',
            lineHeight: 1,
            letterSpacing: '3px',
            color: 'var(--text)',
          }}>
            MONTE TREINOS.<br />
            <span style={{ color: 'var(--primary)' }}>COMPARTILHE O LINK.</span>
          </h1>
          <p style={{
            marginTop: '20px',
            fontFamily: "'Barlow', sans-serif",
            fontSize: '1.1rem',
            color: 'var(--muted)',
            maxWidth: '540px',
            margin: '20px auto 0',
            lineHeight: 1.6,
          }}>
            Crie planos de treino completos com periodização, divisões e exercícios.
            Cada aluno recebe um link personalizado para acessar o próprio treino.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '32px', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn btn-primary" style={{ fontSize: '1rem', padding: '14px 28px' }}>
              Começar grátis →
            </Link>
            <a href="#planos" className="btn btn-outline" style={{ fontSize: '1rem', padding: '14px 28px' }}>
              Ver planos
            </a>
          </div>
        </div>

        {/* Features */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', margin: '40px 0' }}>
          {[
            { icon: '📋', title: 'Builder de treinos', desc: 'Monte divisões PPL, ABC, Full Body e mais. Adicione exercícios com tipo, descanso e notas.' },
            { icon: '📈', title: 'Periodização completa', desc: 'Configure semanas com volume, intensidade, séries e reps. Cluster sets inclusos.' },
            { icon: '🔗', title: 'Link por aluno', desc: 'Cada aluno acessa o treino pelo link /seu-nome/aluno — sem login, sem app.' },
            { icon: '🎨', title: 'Tema personalizado', desc: 'Adapte as cores do painel e da view do aluno para a identidade da sua marca. (Pro)' },
          ].map(f => (
            <div key={f.title} className="card card-red-left" style={{ padding: '20px' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '10px' }}>{f.icon}</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '1rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text)', marginBottom: '6px' }}>
                {f.title}
              </div>
              <p className="text-muted text-sm">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div id="planos" style={{ scrollMarginTop: '80px', margin: '40px 0 60px' }}>
          <div className="section-label" style={{ justifyContent: 'center', marginBottom: '20px' }}>Planos</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Free */}
            <div className="card card-red-top" style={{ padding: '24px' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: '2px', color: 'var(--text)', marginBottom: '4px' }}>
                GRATUITO
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '3rem', color: 'var(--primary)', lineHeight: 1 }}>
                R$ 0
              </div>
              <p className="text-muted text-sm" style={{ margin: '10px 0 20px' }}>Para começar</p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '0', listStyle: 'none', marginBottom: '24px' }}>
                {['Até 3 alunos', 'Todas as divisões de treino', 'Periodização completa', 'Links personalizados por aluno', 'Tema padrão'].map(item => (
                  <li key={item} style={{ fontSize: '0.88rem', color: 'var(--muted)', display: 'flex', gap: '8px' }}>
                    <span style={{ color: 'var(--primary)' }}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="btn btn-outline" style={{ display: 'block', textAlign: 'center', width: '100%' }}>
                Criar conta grátis
              </Link>
            </div>
            {/* Pro */}
            <div className="card" style={{ padding: '24px', border: '1px solid var(--primary)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-12px', left: '20px' }}>
                <span className="badge badge-red">Recomendado</span>
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: '2px', color: 'var(--text)', marginBottom: '4px' }}>
                PRO
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '3rem', color: 'var(--primary)', lineHeight: 1 }}>
                R$ 49<span style={{ fontSize: '1.2rem', color: 'var(--muted)' }}>/mês</span>
              </div>
              <p className="text-muted text-sm" style={{ margin: '10px 0 20px' }}>Para profissionais</p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '0', listStyle: 'none', marginBottom: '24px' }}>
                {['Alunos ilimitados', 'Tudo do plano gratuito', 'Tema de cores personalizado', 'Sua marca na view do aluno', 'Suporte prioritário'].map(item => (
                  <li key={item} style={{ fontSize: '0.88rem', color: 'var(--muted)', display: 'flex', gap: '8px' }}>
                    <span style={{ color: 'var(--primary)' }}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <a href="mailto:contato@fitplan.app?subject=Quero o plano Pro" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', width: '100%' }}>
                Falar sobre o Pro
              </a>
            </div>
          </div>
        </div>

        <footer style={{ borderTop: '1px solid var(--border)', padding: '24px 0', textAlign: 'center' }}>
          <p className="text-muted text-xs" style={{ letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'Barlow Condensed', sans-serif" }}>
            FitPlan · Feito para Personal Trainers
          </p>
        </footer>
      </div>
    </>
  )
}
