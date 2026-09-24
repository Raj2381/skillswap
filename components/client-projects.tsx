'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, MessageCircle, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/client-shell'
import { Layout } from '@/components/client-layout'
import { card, button } from '@/components/client-shell'

type Item = { id: string; title: string; budget: number; deadline: string; created_at: string; status: string; creator_id: string; kind: 'request' | 'project' }

function statusLabel(status: string) { return status.replace('_', ' ').replace(/\b\w/g, character => character.toUpperCase()) }

export function ClientProjectsPage() {
  const { profile, loading: authLoading } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [tab, setTab] = useState('All')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    if (!profile) return
    setLoading(true); setError('')
    const supabase = createClient()
    const [{ data: requests, error: requestsError }, { data: projects, error: projectsError }] = await Promise.all([
      supabase.from('project_requests').select('id,title,budget,deadline,created_at,status,creator_id').eq('client_id', profile.id),
      supabase.from('projects').select('id,title,budget,deadline,created_at,status,creator_id').eq('client_id', profile.id),
    ])
    if (requestsError || projectsError) setError('Something went wrong while loading your projects.')
    else setItems([...((requests ?? []).map(row => ({ ...row, kind: 'request' as const }))), ...((projects ?? []).map(row => ({ ...row, kind: 'project' as const })))] as Item[])
    setLoading(false)
  }

  useEffect(() => { if (!authLoading) void load() }, [authLoading, profile])

  const filtered = useMemo(() => items.filter(item => { const matchesTab = tab === 'All' || (tab === 'Requests' && item.kind === 'request') || (tab === 'Active' && ['accepted', 'in_progress'].includes(item.status)) || (tab === 'Completed' && item.status === 'completed'); return matchesTab && item.title.toLowerCase().includes(query.toLowerCase()) }).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)), [items, query, tab])
  const count = (name: string) => name === 'All' ? items.length : name === 'Requests' ? items.filter(item => item.kind === 'request').length : name === 'Active' ? items.filter(item => ['accepted', 'in_progress'].includes(item.status)).length : items.filter(item => item.status === 'completed').length
  const cancel = async (id: string) => { const supabase = createClient(); const { error: updateError } = await supabase.from('project_requests').update({ status: 'cancelled' }).eq('id', id).eq('client_id', profile?.id).eq('status', 'pending'); if (updateError) setError('Unable to cancel this request.'); else setItems(current => current.map(item => item.id === id ? { ...item, status: 'cancelled' } : item)) }

  return <Layout title="My projects"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative max-w-md flex-1"><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#9F8189]" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search projects" className="w-full rounded-xl border border-[#6A2636] bg-[#1A080E] py-3 pl-11 pr-4 text-sm outline-none" /></div><button onClick={() => void load()} className="rounded-xl border border-[#6A2636] px-4 py-3 text-sm">Refresh</button></div><div className="mt-6 flex gap-2 overflow-x-auto border-b border-[#3A101C] pb-3">{['All', 'Requests', 'Active', 'Completed'].map(value => <button key={value} onClick={() => setTab(value)} className={`whitespace-nowrap px-3 py-2 text-sm ${tab === value ? 'border-b-2 border-[#D66A84] text-white' : 'text-[#9F8189]'}`}>{value} ({count(value)})</button>)}</div>{error && <p role="alert" className="mt-5 rounded-xl border border-[#D65C6F]/40 bg-[#D65C6F]/10 p-4 text-sm text-[#E99AAA]">{error}</p>}{loading || authLoading ? <div className="mt-6 grid gap-4 md:grid-cols-2"><div className="h-44 animate-pulse rounded-2xl bg-[#250C14]" /><div className="h-44 animate-pulse rounded-2xl bg-[#250C14]" /></div> : filtered.length ? <div className="mt-6 grid gap-4 md:grid-cols-2">{filtered.map(item => <article key={`${item.kind}-${item.id}`} className={`${card} p-5`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-[#9F8189]">{item.kind === 'request' ? 'Project request' : 'Project'}</p><h2 className="mt-2 font-semibold">{item.title}</h2></div><span className="rounded-full bg-[#3A101C] px-3 py-1 text-xs text-[#E7A5B5]">{statusLabel(item.status)}</span></div><div className="mt-5 flex flex-wrap gap-4 text-sm text-[#C7A7B0]"><span>₹{Number(item.budget).toLocaleString('en-IN')}</span><span className="inline-flex items-center gap-1"><CalendarDays className="size-4" />Due {item.deadline}</span></div><div className="mt-5 flex gap-2"><Link href={item.kind === 'request' ? `/projects/${item.id}` : `/projects/${item.id}`} className={`${button} flex-1`}>View {item.kind === 'request' ? 'request' : 'project'}</Link><Link href={`/chat?project=${item.id}`} aria-label="Message creator" className="inline-flex items-center justify-center rounded-xl border border-[#6A2636] px-3"><MessageCircle className="size-4" /></Link></div>{item.kind === 'request' && item.status === 'pending' && <button onClick={() => void cancel(item.id)} className="mt-3 text-sm text-[#E7A5B5] underline">Cancel request</button>}</article>)}</div> : <div className={`${card} mt-6 p-12 text-center`}><h2 className="text-xl font-semibold">No projects yet</h2><p className="mt-2 text-sm text-[#9F8189]">You haven&apos;t booked a creator yet. Find a creator and start your first project.</p><Link href="/creators" className={`${button} mt-6`}>Find creators</Link></div>}</Layout>
}
