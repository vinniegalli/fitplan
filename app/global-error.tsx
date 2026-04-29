'use client'

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px', fontFamily: 'sans-serif', background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      <h1 style={{ fontSize: '3rem', color: '#e8192c' }}>Ops!</h1>
      <p style={{ color: '#888', marginBottom: '24px' }}>Ocorreu um erro inesperado.</p>
      <button onClick={() => reset()} style={{ background: '#e8192c', color: '#fff', border: 'none', padding: '10px 24px', cursor: 'pointer', borderRadius: '2px' }}>
        Tentar novamente
      </button>
    </div>
  )
}
