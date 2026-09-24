import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function CreatorRouteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/creator/workspace/dashboard')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role === 'client') redirect('/find-creators')
  return children
}
