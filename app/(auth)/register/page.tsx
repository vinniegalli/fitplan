'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="logo" style={{ justifyContent: 'center', display: 'flex', fontSize: '2.4rem' }}>
            FIT<span>PLAN</span>
          </div>
          <p className="text-muted text-sm" style={{ marginTop: '8px' }}>
            Crie sua conta — plano gratuito, sem cartão
          </p>
        </div>

        <div className="card card-red-top" style={{ padding: '28px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">Seu nome</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="João Silva"
                required
              />
            </div>

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

            <div className="form-group">
              <label className="form-label">Senha</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                autoComplete="new-password"
              />
              <span className="form-hint">Plano grátis: até 3 alunos</span>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={{ justifyContent: 'center', marginTop: '8px' }}
            >
              {loading ? 'Criando conta...' : 'Criar conta grátis'}
            </button>
          </form>
        </div>

        <p className="text-muted text-sm" style={{ textAlign: 'center', marginTop: '20px' }}>
          Já tem conta?{' '}
          <Link href="/login" style={{ color: 'var(--accent)' }}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
