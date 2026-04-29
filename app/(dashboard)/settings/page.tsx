import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trainer } = await supabase
    .from('trainers')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!trainer) redirect('/login')

  return <SettingsClient trainer={trainer} />
}
