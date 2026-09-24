'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/client-shell'
import { Layout, card, button } from '@/components/client-shell'

export default function SettingsPage() {
  const { signOut } = useAuth()
  const router = useRouter()
  const logout = async () => { const { error } = await signOut(); if (!error) { router.replace('/'); router.refresh() } }
  return <Layout title="Settings"><section className={`${card} max-w-2xl p-6`}><h2 className="text-xl font-semibold">Account settings</h2><p className="mt-2 text-sm text-[#C7A7B0]">Manage your profile and authentication preferences.</p><div className="mt-6 grid gap-3"><button onClick={() => router.push('/profile/edit')} className="rounded-xl border border-[#6A2636] px-4 py-3 text-left text-sm">Edit profile</button><button onClick={logout} className={`${button} justify-center`}>Logout</button></div></section></Layout>
}
