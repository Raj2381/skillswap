'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { card, button } from '@/components/client-shell'

type Booking = { id: string; client_name: string; requirements: string; status: 'pending' | 'accepted' | 'declined'; created_at: string; demo_gigs: { title: string; creator_name: string; rate: number } | null }
const demoClientId = 'demo-client'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const load = async () => { const { data, error: queryError } = await createClient().from('demo_bookings').select('id,client_name,requirements,status,created_at,demo_gigs(title,creator_name,rate)').eq('client_id', demoClientId).order('created_at', { ascending: false }); if (queryError) setError('Bookings could not be loaded.'); else setBookings((data ?? []) as unknown as Booking[]); setLoading(false) }
  useEffect(() => { void load() }, [])
  return <main className="min-h-screen bg-[#12070B] px-5 py-10 text-[#FFF5F6]"><div className="mx-auto max-w-5xl"><div className="flex items-end justify-between"><div><p className="text-xs uppercase tracking-[.18em] text-[#D66A84]">PUBLIC DEMO</p><h1 className="mt-3 text-4xl font-semibold">My bookings</h1></div><Link href="/marketplace" className={button}>Browse gigs</Link></div>{error && <p role="alert" className="mt-5 text-sm text-rose-200">{error}</p>}{loading ? <div className={`${card} mt-8 h-48 animate-pulse`} /> : bookings.length ? <div className="mt-8 grid gap-4">{bookings.map(booking => <article className={`${card} flex flex-col justify-between gap-4 md:flex-row md:items-center`} key={booking.id}><div><p className="text-xs text-[#9F8189]">{new Date(booking.created_at).toLocaleDateString()}</p><h2 className="mt-2 text-lg font-semibold">{booking.demo_gigs?.title || 'Gig'}</h2><p className="mt-1 text-sm text-[#C7A7B0]">{booking.demo_gigs?.creator_name || 'Creator'} · ₹{Number(booking.demo_gigs?.rate || 0).toLocaleString('en-IN')}</p></div><span className={`rounded-full px-3 py-1 text-xs ${booking.status === 'accepted' ? 'bg-emerald-500/15 text-emerald-300' : booking.status === 'declined' ? 'bg-rose-500/15 text-rose-300' : 'bg-amber-500/15 text-amber-300'}`}>{booking.status[0].toUpperCase() + booking.status.slice(1)}</span></article>)}</div> : <div className={`${card} mt-8 p-12 text-center text-sm text-[#9F8189]`}>No bookings yet. Browse gigs to get started.</div>}</div></main>
}
