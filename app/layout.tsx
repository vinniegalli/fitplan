import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FitPlan — Plataforma para Personal Trainers',
  description: 'Crie e compartilhe planos de treino personalizados com seus alunos.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
