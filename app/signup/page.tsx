'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { ArrowRight, Check, Eye, EyeOff, Palette, Search, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [role, setRole] = useState<'client' | 'creator' | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!role) return setError('Please choose how you want to use SkillSwap.')
    const email = form.email.trim().toLowerCase()
    if (!email) return setError('Please enter your email.')
    if (!form.password) return setError('Please enter a password.')
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    setBusy(true)
    const supabase = createClient()
    const redirectUrl = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'http://localhost:3000/auth/callback')
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { name: form.name, role },
      },
    })
    if (authError) {
      console.error('Supabase signup error:', { message: authError.message, status: authError.status, code: authError.code })
      const message = authError.message.toLowerCase()
      setError(message.includes('already') || message.includes('registered') ? 'An account with this email already exists.' : authError.message || 'Unable to create your account. Please try again.')
      setBusy(false)
      return
    }
    if (data.user && data.session) {
      const { error: profileError } = await supabase.from('profiles').upsert({ id: data.user.id, name: form.name.trim(), email, role, avatar_url: null }, { onConflict: 'id' })
      if (profileError) {
        console.error('Profile creation error after signup:', profileError)
        setError('Your account was created, but your profile could not be saved. Please contact support.')
        setBusy(false)
        return
      }
    }
    if (data.session) router.replace(role === 'creator' ? '/creator/workspace/dashboard' : '/find-creators')
    else router.replace('/login')
  }

  const update = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }))
  const inputClass = 'h-13 w-full rounded-xl border border-[#54202F] bg-[#1D0A11] px-4 text-[#FFF5F6] outline-none transition placeholder:text-[#9F7B85] focus:border-[#A52245] focus:ring-4 focus:ring-[#A52245]/15'

  return (
    <main className="min-h-screen bg-[#12070B] px-4 py-7 text-[#FFF5F6] sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="inline-flex items-center gap-2 text-xl font-semibold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#8F1D3B] text-[#FFF5F6] shadow-[0_0_24px_rgba(165,34,69,.35)]"><Sparkles className="size-4" /></span>
          Skill<span className="text-[#E99AAA]">Swap</span>
        </Link>
        <div className="mx-auto mt-12 max-w-3xl rounded-[24px] border border-[#54202F] bg-[#250C14] p-6 shadow-2xl shadow-black/30 sm:mt-16 sm:p-10">
          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-[.18em] text-[#D66A84]">GET STARTED</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Create your SkillSwap account</h1>
            <p className="mt-2 text-sm text-[#9F7B85]">Join a community where skills become opportunities.</p>
          </div>
          <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
            <fieldset className="flex flex-col gap-3">
              <legend className="text-sm font-semibold uppercase tracking-[.14em] text-[#D5B8C0]">What brings you here?</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => setRole('client')} aria-pressed={role === 'client'} className={`rounded-2xl border p-5 text-left transition ${role === 'client' ? 'border-[#D66A84] bg-[#491629] shadow-[0_0_22px_rgba(165,34,69,.25)]' : 'border-[#54202F] bg-[#1D0A11] hover:border-[#8F1D3B]'}`}>
                  <Search className="size-5 text-[#E99AAA]" /><span className="mt-3 block font-semibold">Find creators</span><span className="mt-1 block text-sm text-[#9F7B85]">Discover and book talented creators.</span>{role === 'client' && <Check className="mt-3 size-4 text-[#E99AAA]" />}
                </button>
                <button type="button" onClick={() => setRole('creator')} aria-pressed={role === 'creator'} className={`rounded-2xl border p-5 text-left transition ${role === 'creator' ? 'border-[#D66A84] bg-[#491629] shadow-[0_0_22px_rgba(165,34,69,.25)]' : 'border-[#54202F] bg-[#1D0A11] hover:border-[#8F1D3B]'}`}>
                  <Palette className="size-5 text-[#E99AAA]" /><span className="mt-3 block font-semibold">Offer my skills</span><span className="mt-1 block text-sm text-[#9F7B85]">Post gigs and grow your creative work.</span>{role === 'creator' && <Check className="mt-3 size-4 text-[#E99AAA]" />}
                </button>
              </div>
            </fieldset>
            <label className="flex flex-col gap-2 text-sm font-medium text-[#D5B8C0]">Full name<input required value={form.name} onChange={e => update('name', e.target.value)} placeholder="Your name" className={inputClass} /></label>
            <label className="flex flex-col gap-2 text-sm font-medium text-[#D5B8C0]">Email address<input required type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" className={inputClass} /></label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-[#D5B8C0]">Password<div className="relative"><input required type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} placeholder="At least 6 characters" className={`${inputClass} pr-12`} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9F7B85] hover:text-[#E99AAA]">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[#D5B8C0]">Confirm password<div className="relative"><input required type={showConfirm ? 'text' : 'password'} value={form.confirm} onChange={e => update('confirm', e.target.value)} placeholder="Repeat password" className={`${inputClass} pr-12`} /><button type="button" onClick={() => setShowConfirm(!showConfirm)} aria-label={showConfirm ? 'Hide confirmation' : 'Show confirmation'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9F7B85] hover:text-[#E99AAA]">{showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></label>
            </div>
            {error && <p role="alert" className="text-sm text-[#F19AAA]">{error}</p>}
            <button type="submit" disabled={busy} className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-[#8F1D3B] px-5 font-semibold text-[#FFF5F6] transition hover:bg-[#A52245] disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Creating account…' : 'Create Account'}<ArrowRight className="size-4" /></button>
          </form>
          <p className="mt-6 text-center text-sm text-[#9F7B85]">Already have an account? <Link href="/login" className="font-semibold text-[#E99AAA] hover:underline">Log in</Link></p>
        </div>
      </div>
    </main>
  )
}
