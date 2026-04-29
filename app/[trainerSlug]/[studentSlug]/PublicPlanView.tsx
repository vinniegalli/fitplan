'use client'

import { useState } from 'react'
import type { Student, TrainingPlan, WorkoutDay, Exercise, PeriodizationWeek, TrainerTheme } from '@/lib/types'

interface Props {
  trainerName: string
  student: Student
  plan: TrainingPlan
  days: WorkoutDay[]
  exercisesByDay: Record<string, Exercise[]>
  periodWeeks: PeriodizationWeek[]
  theme: TrainerTheme
}

function themeVars(t: TrainerTheme): React.CSSProperties {
  return {
    '--primary':     t.primary,
    '--primary-dim': t.primaryDim,
    '--bg':          t.bg,
    '--surface':     t.surface,
    '--surface2':    t.surface2,
    '--border':      t.border,
    '--text':        t.text,
    '--muted':       t.muted,
    '--accent':      t.accent,
    '--red':         t.primary,
    '--red-dim':     t.primaryDim,
  } as React.CSSProperties
}

export default function PublicPlanView({ trainerName, student, plan, days, exercisesByDay, periodWeeks, theme }: Props) {
  const [activeDay, setActiveDay] = useState<string>(days[0]?.id ?? '')
  const [activeWeek, setActiveWeek] = useState<number>(1)
  const [section, setSection] = useState<'workout' | 'period'>('workout')

  const currentDay = days.find(d => d.id === activeDay)
  const currentExercises = exercisesByDay[activeDay] ?? []
  const currentPeriod = periodWeeks.find(w => w.week_number === activeWeek)

  function getVolume(ex: Exercise): string {
    if (!currentPeriod) return '— × —'
    if (ex.type === 'cluster' && currentPeriod.is_cluster && ex.cluster_block) {
      return `${currentPeriod.sets_range} × ${ex.cluster_block}`
    }
    return `${currentPeriod.sets_range} × ${currentPeriod.reps_range}`
  }

  function isClusterActive(ex: Exercise): boolean {
    return ex.type === 'cluster' && !!currentPeriod?.is_cluster
  }

  const volLabelClass = (label: string | null) => {
    if (!label) return 'pill pill-baixo'
    const l = label.toLowerCase()
    if (l.includes('deload')) return 'pill pill-deload'
    if (l.includes('alto'))   return 'pill pill-alto'
    if (l.includes('médio'))  return 'pill pill-medio'
    return 'pill pill-baixo'
  }

  const intLabelClass = (label: string | null) => {
    if (!label) return 'pill pill-baixo'
    if (label === 'Alta')  return 'pill pill-alto'
    if (label === 'Média') return 'pill pill-medio'
    return 'pill pill-baixo'
  }

  return (
    <div style={themeVars(theme)}>
      {/* Header */}
      <header className="site-header">
        <div className="site-header-inner" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div className="logo" style={{ fontSize: '2rem' }}>FIT<span>PLAN</span></div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.72rem', fontWeight: 700, letterSpacing: '2px', color: 'var(--muted)', textTransform: 'uppercase', marginTop: '2px' }}>
                por {trainerName}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="badge">{student.name}</span>
              {student.weight && <span className="badge">{student.weight}kg</span>}
              {student.level  && <span className="badge badge-red">{student.level}</span>}
              <span className="badge">{plan.division_type} · {plan.total_weeks}sem</span>
            </div>
          </div>

          {/* Week selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', width: '100%' }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', marginRight: '2px' }}>
              Semana:
            </span>
            {periodWeeks.map(pw => {
              const isDeload = pw.volume_label?.toLowerCase().includes('deload')
              const isCluster = pw.is_cluster
              return (
                <button
                  key={pw.week_number}
                  onClick={() => setActiveWeek(pw.week_number)}
                  className={[
                    'wk-btn',
                    activeWeek === pw.week_number ? 'active' : '',
                    isDeload ? 'is-deload' : '',
                    isCluster ? 'is-cluster' : '',
                  ].join(' ').trim()}
                >
                  S{pw.week_number}
                </button>
              )
            })}
            {currentPeriod && (
              <span className="wk-info">
                S{activeWeek} · {currentPeriod.sets_range} × {currentPeriod.reps_range} · {currentPeriod.volume_label}
              </span>
            )}
          </div>

          {/* Section nav */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {days.map(d => (
              <button
                key={d.id}
                onClick={() => { setActiveDay(d.id); setSection('workout') }}
                className={`wk-btn${activeDay === d.id && section === 'workout' ? ' active' : ''}`}
                style={{ fontSize: '0.8rem', padding: '5px 12px' }}
              >
                {d.label}
              </button>
            ))}
            <button
              onClick={() => setSection('period')}
              className={`wk-btn${section === 'period' ? ' active' : ''}`}
              style={{ fontSize: '0.8rem', padding: '5px 12px' }}
            >
              Periodização
            </button>
          </div>
        </div>
      </header>

      <div className="container">
        {/* ── WORKOUT VIEW ── */}
        {section === 'workout' && currentDay && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '3rem', color: 'var(--primary)', lineHeight: 1, letterSpacing: '2px' }}>
                {currentDay.label}
              </h1>
              {currentDay.focus && (
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, color: 'var(--muted)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.9rem', marginTop: '4px' }}>
                  {currentDay.focus}
                </p>
              )}
            </div>

            {currentDay.warmup && (
              <div style={{ background: 'rgba(232,25,44,0.05)', border: '1px solid var(--primary-dim)', borderLeft: '3px solid var(--primary)', padding: '12px 16px', marginBottom: '20px', fontSize: '0.85rem', color: 'var(--muted)' }}>
                <strong style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.7rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', display: 'block', marginBottom: '4px' }}>
                  ⚡ Aquecimento
                </strong>
                {currentDay.warmup}
              </div>
            )}

            <div className="scrollable">
              <table className="exercise-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Exercício</th>
                    <th>Volume</th>
                    <th>Descanso</th>
                    <th>Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {currentExercises.map((ex, i) => {
                    const clusterActive = isClusterActive(ex)
                    return (
                      <tr key={ex.id} data-vol={ex.type === 'cluster' || ex.type === 'compound' ? ex.type : undefined}>
                        <td className="ex-num">{String(i + 1).padStart(2, '0')}</td>
                        <td>
                          <span className="ex-name">{ex.name}</span>
                          {ex.type === 'compound' && <span className="ex-tag">Compound</span>}
                          {ex.type === 'cluster' && (
                            <span className={`ex-tag ex-tag-cluster${clusterActive ? '' : ' ex-tag-dimmed'}`}>
                              Cluster
                            </span>
                          )}
                          {ex.notes && (
                            <div className="ex-note">
                              {ex.type === 'cluster' && (
                                <>
                                  <span style={{ display: clusterActive ? '' : 'none' }}>
                                    {ex.notes}
                                  </span>
                                  <span style={{ display: clusterActive ? 'none' : '' }}>
                                    Séries convencionais. RIR 1–2.
                                  </span>
                                </>
                              )}
                              {ex.type !== 'cluster' && ex.notes}
                            </div>
                          )}
                        </td>
                        <td><span className="vol-chip">{getVolume(ex)}</span></td>
                        <td><span className="rest-chip">{ex.rest_time ?? '—'}</span></td>
                        <td></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── PERIODIZATION VIEW ── */}
        {section === 'period' && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '3rem', color: 'var(--primary)', lineHeight: 1, letterSpacing: '2px' }}>
                PERIODIZAÇÃO
              </h1>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, color: 'var(--muted)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.9rem', marginTop: '4px' }}>
                {plan.total_weeks} semanas · {plan.division_type}
              </p>
            </div>

            <div className="scrollable">
              <table className="period-table">
                <thead>
                  <tr>
                    <th>SEMANA</th>
                    <th>VOLUME</th>
                    <th>INTENSIDADE</th>
                    <th>SÉRIES × REPS</th>
                    <th>OBSERVAÇÃO</th>
                  </tr>
                </thead>
                <tbody>
                  {periodWeeks.map(pw => (
                    <tr key={pw.id} className={pw.week_number === activeWeek ? 'period-active' : ''}>
                      <td className="week-col">S{pw.week_number}</td>
                      <td><span className={volLabelClass(pw.volume_label)}>{pw.volume_label ?? '—'}</span></td>
                      <td><span className={intLabelClass(pw.intensity_label)}>{pw.intensity_label ?? '—'}</span></td>
                      <td>{pw.sets_range} × {pw.reps_range}</td>
                      <td style={{ textAlign: 'left', fontSize: '0.78rem', color: 'var(--muted)' }}>{pw.observation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
