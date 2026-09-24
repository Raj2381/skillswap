'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    const redirectUrl = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'http://localhost:3000/auth/callback')
    await createClient().auth.resetPasswordForEmail(email, { redirectTo: redirectUrl })
    setSent(true)
  }
  return <main className="flex min-h-screen items-center justify-center bg-[#12070B] px-5 text-[#FFF5F6]"><div className="w-full max-w-md rounded-2xl border border-[#3A101C] bg-[#250C14] p-8"><Link href="/" className="text-sm text-[#D66A84]">SkillSwap</Link><h1 className="mt-10 text-3xl font-semibold">Reset your password</h1><p className="mt-3 text-sm leading-6 text-[#C7A7B0]">Enter your email and we&apos;ll send you a reset link.</p>{sent ? <p className="mt-8 rounded-xl border border-[#54202F] bg-[#1A080E] p-4 text-sm text-[#E7A5B5]">If an account exists for that email, a reset link is on its way.</p> : <form onSubmit={submit} className="mt-8 flex flex-col gap-4"><label className="flex flex-col gap-2 text-sm">Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="rounded-xl border border-[#6A2636] bg-[#1A080E] px-4 py-3 outline-none"/></label><button className="rounded-xl bg-[#A52546] px-4 py-3 text-sm font-semibold">Send reset link</button></form>}<Link href="/login" className="mt-6 block text-center text-sm text-[#D66A84]">Back to login</Link></div></main>
}
