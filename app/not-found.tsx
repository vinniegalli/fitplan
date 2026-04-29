import Link from 'next/link'

export default function NotFound() {
  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <div className="logo">FIT<span>PLAN</span></div>
        </div>
      </header>
      <div className="container" style={{ textAlign: 'center', padding: '80px 0' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '8rem', color: 'var(--primary)', lineHeight: 1 }}>
          404
        </div>
        <p className="text-muted" style={{ marginTop: '12px', marginBottom: '24px' }}>
          Página não encontrada
        </p>
        <Link href="/" className="btn btn-primary">← Voltar ao início</Link>
      </div>
    </>
  )
}
