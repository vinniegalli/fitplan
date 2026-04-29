import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trainer } = await supabase
    .from('trainers')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!trainer) redirect('/login')

  const { data: students } = await supabase
    .from('students')
    .select('*, training_plans(id, division_type, total_weeks, active)')
    .eq('trainer_id', trainer.id)
    .order('created_at', { ascending: false })

  return (
    <DashboardClient
      trainer={trainer}
      initialStudents={students ?? []}
    />
  )
}
