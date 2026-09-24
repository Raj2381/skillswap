import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function CreatorDashboardRedirect() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  redirect(profile?.role === 'creator' ? '/creator/workspace/dashboard' : '/find-creators')
}
