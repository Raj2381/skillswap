import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ClientCreatorsPage } from '@/components/client-creators'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role === 'creator') redirect('/creator/workspace/dashboard')
  return <Suspense fallback={<main className="min-h-screen bg-[#12070B]" />}><ClientCreatorsPage /></Suspense>
}
