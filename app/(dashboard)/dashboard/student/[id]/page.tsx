import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Exercise } from '@/lib/types'
import StudentBuilderClient from './StudentBuilderClient'

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trainer } = await supabase
    .from('trainers')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!trainer) redirect('/login')

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .eq('trainer_id', trainer.id)
    .single()

  if (!student) notFound()

  const { data: plan } = await supabase
    .from('training_plans')
    .select('*')
    .eq('student_id', student.id)
    .eq('active', true)
    .maybeSingle()

  let workoutDays = []
  const exercises: Record<string, Exercise[]> = {}
  let periodizationWeeks = []

  if (plan) {
    const { data: days } = await supabase
      .from('workout_days')
      .select('*')
      .eq('plan_id', plan.id)
      .order('day_order')

    workoutDays = days ?? []

    for (const day of workoutDays) {
      const { data: exs } = await supabase
        .from('exercises')
        .select('*')
        .eq('workout_day_id', day.id)
        .order('exercise_order')
      exercises[day.id] = exs ?? []
    }

    const { data: weeks } = await supabase
      .from('periodization_weeks')
      .select('*')
      .eq('plan_id', plan.id)
      .order('week_number')

    periodizationWeeks = weeks ?? []
  }

  return (
    <StudentBuilderClient
      trainer={trainer}
      student={student}
      initialPlan={plan}
      initialDays={workoutDays}
      initialExercises={exercises}
      initialPeriodization={periodizationWeeks}
    />
  )
}
