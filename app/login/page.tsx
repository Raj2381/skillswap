'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { ArrowRight, Eye, EyeOff, Palette, Search, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function BrandMark() {
  return <Link href="/" className="inline-flex items-center gap-2 text-xl font-semibold tracking-tight"><span className="flex size-9 items-center justify-center rounded-xl bg-[#8F1D3B] text-[#FFF5F6] shadow-[0_0_24px_rgba(165,34,69,.35)]"><Sparkles className="size-4" /></span><span className="text-[#FFF5F6]">Skill<span className="text-[#E99AAA]">Swap</span></span></Link>
}

function MarketplacePreview() {
  return <div className="relative mt-12 hidden max-w-md lg:block"><div className="absolute -inset-10 rounded-full bg-[#8F1D3B]/20 blur-3xl" /><div className="relative grid grid-cols-2 gap-3"><div className="rounded-2xl border border-[#54202F] bg-[#250C14] p-4 shadow-2xl shadow-black/20"><div className="mb-8 flex size-9 items-center justify-center rounded-xl bg-[#2E0E18] text-[#E99AAA]"><Palette className="size-4" /></div><p className="text-sm font-medium text-[#FFF5F6]">Logo design</p><p className="mt-1 text-xs text-[#9F7B85]">Brand identity</p><p className="mt-4 text-sm font-semibold text-[#E99AAA]">₹499</p></div><div className="mt-8 rounded-2xl border border-[#54202F] bg-[#2E0E18] p-4 shadow-2xl shadow-black/20"><div className="mb-8 flex size-9 items-center justify-center rounded-xl bg-[#250C14] text-[#E99AAA]"><Search className="size-4" /></div><p className="text-sm font-medium text-[#FFF5F6]">Video editing</p><p className="mt-1 text-xs text-[#9F7B85]">Short-form content</p><p className="mt-4 text-sm font-semibold text-[#E99AAA]">₹799</p></div></div></div>
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    const { data, error: authError }: { data: { user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null }; error: { message: string } | null } = await supabase.auth.signInWithPassword({ email, password })
    if (authError || !data.user) { setError(authError?.message.includes('confirm') ? 'Please confirm your email before logging in.' : 'Invalid email or password.'); setBusy(false); return }
    const metadata = data.user.user_metadata
    await supabase.from('profiles').upsert({ id: data.user.id, name: metadata?.name ?? email.split('@')[0], email: data.user.email ?? email, role: metadata?.role ?? 'client', avatar_url: null }, { onConflict: 'id' })
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
    const next = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('next') : null
    const destination = next?.startsWith('/') && !next.startsWith('//') ? next : profile?.role === 'creator' ? '/creator/workspace/dashboard' : '/find-creators'
    router.replace(destination)
  }

  return <main className="min-h-screen bg-[#12070B] text-[#FFF5F6]"><div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1fr_480px]"><section className="flex flex-col px-6 py-8 sm:px-10 lg:justify-center lg:px-16"><BrandMark /><div className="mt-16 max-w-xl lg:mt-24"><p className="text-xs font-semibold tracking-[.22em] text-[#D66A84]">THE CREATOR MARKETPLACE</p><h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">Turn your skills into opportunities.</h1><p className="mt-6 max-w-lg text-base leading-7 text-[#D5B8C0]">Discover talented creators, showcase your skills, and connect with people who need what you do.</p><MarketplacePreview /></div></section><section className="flex items-center px-6 py-8 sm:px-10 lg:px-6"><div className="w-full rounded-[24px] border border-[#54202F] bg-[#250C14] p-6 shadow-2xl shadow-black/30 sm:p-9"><p className="text-xs font-semibold tracking-[.18em] text-[#D66A84]">WELCOME BACK</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Welcome back</h2><p className="mt-2 text-sm text-[#9F7B85]">Log in to your SkillSwap account.</p><form onSubmit={submit} className="mt-8 flex flex-col gap-5"><label className="flex flex-col gap-2 text-sm font-medium text-[#D5B8C0]">Email address<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="h-13 rounded-xl border border-[#54202F] bg-[#1D0A11] px-4 text-[#FFF5F6] outline-none transition placeholder:text-[#9F7B85] focus:border-[#A52245] focus:ring-4 focus:ring-[#A52245]/15" /></label><label className="flex flex-col gap-2 text-sm font-medium text-[#D5B8C0]">Password<div className="relative"><input required type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" className="h-13 w-full rounded-xl border border-[#54202F] bg-[#1D0A11] px-4 pr-12 text-[#FFF5F6] outline-none transition placeholder:text-[#9F7B85] focus:border-[#A52245] focus:ring-4 focus:ring-[#A52245]/15" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9F7B85] hover:text-[#E99AAA]">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></label><div className="-mt-2 flex justify-end"><Link href="/forgot-password" className="text-xs font-medium text-[#E99AAA] hover:text-[#FFF5F6]">Forgot password?</Link></div>{error && <p role="alert" className="rounded-xl border border-[#D65C6F]/40 bg-[#D65C6F]/10 px-4 py-3 text-sm text-[#E99AAA]">{error}</p>}<button disabled={busy} className="flex h-13 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8F1D3B] to-[#A52245] font-semibold text-[#FFF5F6] shadow-lg shadow-[#8F1D3B]/20 transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Logging in...' : 'Log In'}<ArrowRight className="size-4" /></button></form><div className="my-7 flex items-center gap-3 text-xs text-[#9F7B85]"><span className="h-px flex-1 bg-[#54202F]" />OR<span className="h-px flex-1 bg-[#54202F]" /></div><button type="button" className="flex h-13 w-full items-center justify-center gap-3 rounded-xl border border-[#54202F] bg-[#2E0E18] text-sm font-medium text-[#D5B8C0] transition hover:border-[#8F1D3B] hover:text-[#FFF5F6]"><span className="font-semibold text-[#E99AAA]">G</span>Continue with Google</button><p className="mt-7 text-center text-sm text-[#9F7B85]">Don&apos;t have an account? <Link href="/signup" className="font-medium text-[#E99AAA] hover:text-[#FFF5F6]">Create an account</Link></p></div></section></div></main>
}
