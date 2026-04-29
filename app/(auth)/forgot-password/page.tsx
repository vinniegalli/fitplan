'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="logo" style={{ justifyContent: 'center', display: 'flex', fontSize: '2.4rem' }}>
            FIT<span>PLAN</span>
          </div>
          <p className="text-muted text-sm" style={{ marginTop: '8px' }}>
            Recuperação de senha
          </p>
        </div>

        <div className="card card-red-top" style={{ padding: '28px' }}>
          {sent ? (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ color: 'var(--primary)', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', letterSpacing: '2px' }}>
                E-MAIL ENVIADO
              </div>
              <p className="text-muted text-sm" style={{ lineHeight: 1.6 }}>
                Verifique sua caixa de entrada em <strong style={{ color: 'var(--text)' }}>{email}</strong> e clique no link para redefinir sua senha.
              </p>
              <Link href="/login" className="btn btn-outline btn-sm" style={{ textAlign: 'center' }}>
                Voltar ao login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && <div className="alert alert-error">{error}</div>}
              <p className="text-muted text-sm" style={{ lineHeight: 1.5, marginBottom: '4px' }}>
                Informe seu e-mail e enviaremos um link para redefinir sua senha.
              </p>
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
                style={{ justifyContent: 'center', marginTop: '4px' }}
              >
                {loading ? 'Enviando...' : 'Enviar link de redefinição'}
              </button>
            </form>
          )}
        </div>

        {!sent && (
          <p className="text-muted text-sm" style={{ textAlign: 'center', marginTop: '20px' }}>
            Lembrou a senha?{' '}
            <Link href="/login" style={{ color: 'var(--accent)' }}>
              Voltar ao login
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
