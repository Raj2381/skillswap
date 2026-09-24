'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { card, button } from '@/components/client-shell'

type Gig = { id: string; creator_name: string; creator_username: string; title: string; category: string; rate: number; description: string }
const demoClientId = 'demo-client'

export default function GigPage() {
  const { gigId } = useParams<{ gigId: string }>(); const router = useRouter(); const [gig, setGig] = useState<Gig | null>(null); const [form, setForm] = useState({ clientName: '', requirements: '' }); const [loading, setLoading] = useState(true); const [sending, setSending] = useState(false); const [message, setMessage] = useState('')
  useEffect(() => { const load = async () => { const result = await createClient().from('demo_gigs').select('*').eq('id', gigId).maybeSingle() as { data: Gig | null }; setGig(result.data); setLoading(false) }; void load() }, [gigId])
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setSending(true); setMessage(''); const { error } = await createClient().from('demo_bookings').insert({ gig_id: gigId, client_id: demoClientId, client_name: form.clientName.trim(), requirements: form.requirements.trim() }).select('id').single(); if (error) setMessage('Booking could not be created. Please try again.'); else { setMessage('Booking created. Status: Pending.'); setTimeout(() => router.push('/bookings'), 500) }; setSending(false) }
  if (loading) return <main className="min-h-screen bg-[#12070B] p-10 text-white">Loading gig...</main>
  if (!gig) return <main className="min-h-screen bg-[#12070B] p-10 text-white"><div className={`${card} mx-auto max-w-xl p-10 text-center`}><h1 className="text-2xl font-semibold">Gig not found</h1><Link href="/marketplace" className={`${button} mt-6`}>Back to marketplace</Link></div></main>
  return <main className="min-h-screen bg-[#12070B] px-5 py-10 text-[#FFF5F6]"><div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_380px]"><section className={`${card} p-7`}><Link href="/marketplace" className="text-sm text-[#D66A84]">Back to marketplace</Link><p className="mt-8 text-xs uppercase tracking-[.18em] text-[#D66A84]">{gig.category}</p><h1 className="mt-3 text-4xl font-semibold">{gig.title}</h1><p className="mt-4 text-[#C7A7B0]">By {gig.creator_name} · {gig.creator_username}</p><p className="mt-8 leading-8 text-[#C7A7B0]">{gig.description}</p><p className="mt-8 text-2xl font-semibold">₹{Number(gig.rate).toLocaleString('en-IN')}</p></section><section className={`${card} p-7`}><h2 className="text-xl font-semibold">Book this gig</h2><p className="mt-2 text-sm text-[#9F8189]">No account required for the public demo.</p><form onSubmit={submit} className="mt-6 grid gap-4"><label className="grid gap-2 text-sm">Your name<input required value={form.clientName} onChange={event => setForm({ ...form, clientName: event.target.value })} className="rounded-xl border border-[#6A2636] bg-[#1A080E] p-3 outline-none" /></label><label className="grid gap-2 text-sm">Requirements<textarea required value={form.requirements} onChange={event => setForm({ ...form, requirements: event.target.value })} className="min-h-32 rounded-xl border border-[#6A2636] bg-[#1A080E] p-3 outline-none" /></label>{message && <p role="status" className="text-sm text-emerald-300">{message}</p>}<button disabled={sending} className={`${button} justify-center disabled:opacity-50`}>{sending ? 'Booking...' : 'Book gig'}</button></form></section></div></main>
}
