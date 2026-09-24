'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, MessageCircle, Search, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/client-shell'
import { Layout, card, button } from '@/components/client-shell'

type HistoryItem = { id: string; title: string; budget: number; status: string; deadline: string; start_date: string | null; created_at: string; updated_at: string; creator_id: string; creatorName: string; creatorAvatar: string | null; review: { rating: number; comment: string | null } | null }

export default function WorkHistoryPage() {
  const { profile, loading: authLoading } = useAuth()
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [sort, setSort] = useState('Newest')
  const [visible, setVisible] = useState(10)

  const load = async () => {
    if (!profile) return
    setLoading(true); setError('')
    const supabase = createClient()
    const { data, error: queryError } = await supabase.from('projects').select('id,title,budget,status,deadline,start_date,created_at,updated_at,creator_id').eq('client_id', profile.id).in('status', ['completed', 'cancelled']).order('created_at', { ascending: false })
    if (queryError) { console.error('Work history load error:', queryError); setError('Work history could not be loaded.') ; setLoading(false); return }
    const rows = data ?? []
    const creatorIds = [...new Set(rows.map(row => row.creator_id))]
    const [{ data: creators }, { data: reviews }] = await Promise.all([
      creatorIds.length ? supabase.from('profiles').select('id,name,avatar_url').in('id', creatorIds) : Promise.resolve({ data: [] }),
      rows.length ? supabase.from('reviews').select('project_id,rating,comment').in('project_id', rows.map(row => row.id)) : Promise.resolve({ data: [] }),
    ])
    const creatorMap = new Map((creators ?? []).map(row => [row.id, row]))
    const reviewMap = new Map((reviews ?? []).map(row => [row.project_id, row]))
    setItems(rows.map(row => ({ ...row, creatorName: creatorMap.get(row.creator_id)?.name || 'Creator', creatorAvatar: creatorMap.get(row.creator_id)?.avatar_url || null, review: reviewMap.get(row.id) || null })) as HistoryItem[])
    setLoading(false)
  }

  useEffect(() => { if (!authLoading) void load() }, [authLoading, profile])

  const filtered = useMemo(() => items.filter(item => (filter === 'All' || item.status === filter.toLowerCase()) && `${item.title} ${item.creatorName}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === 'Oldest' ? Date.parse(a.created_at) - Date.parse(b.created_at) : sort === 'Highest budget' ? Number(b.budget) - Number(a.budget) : Date.parse(b.created_at) - Date.parse(a.created_at)), [filter, items, query, sort])
  const completed = items.filter(item => item.status === 'completed')
  const totalSpent = completed.reduce((sum, item) => sum + Number(item.budget || 0), 0)
  const reviewCount = items.filter(item => item.review).length
  const creatorCount = new Set(items.map(item => item.creator_id)).size

  return <Layout><div className="mb-8"><Link href="/projects" className="inline-flex items-center gap-2 text-sm text-[#D66A84]"><ArrowLeft className="size-4" />Back to My projects</Link><h1 className="mt-6 text-4xl font-semibold">Work history</h1><p className="mt-3 text-[#C7A7B0]">Everything you&apos;ve completed with creators.</p></div><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[['Completed projects', completed.length], ['Total spent', `₹${totalSpent.toLocaleString('en-IN')}`], ['Reviews given', reviewCount], ['Creators worked with', creatorCount]].map(([label, value]) => <div key={String(label)} className={`${card} p-4`}><p className="text-xs text-[#9F8189]">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}</div><div className="mt-8 flex flex-col gap-3 md:flex-row"><div className="relative flex-1"><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#9F8189]" /><input aria-label="Search work history" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by project or creator" className="w-full rounded-xl border border-[#6A2636] bg-[#1A080E] py-3 pl-11 pr-4 text-sm outline-none focus:border-[#D66A84]" /></div><select value={filter} onChange={event => setFilter(event.target.value)} className="rounded-xl border border-[#6A2636] bg-[#1A080E] px-4 py-3 text-sm"><option>All</option><option>Completed</option><option>Cancelled</option></select><select value={sort} onChange={event => setSort(event.target.value)} className="rounded-xl border border-[#6A2636] bg-[#1A080E] px-4 py-3 text-sm"><option>Newest</option><option>Oldest</option><option>Highest budget</option></select></div>{error && <div className="mt-6 rounded-xl border border-[#D65C6F]/40 bg-[#D65C6F]/10 p-4 text-sm text-[#E99AAA]">{error}<button onClick={() => void load()} className="ml-3 underline">Retry</button></div>}{loading || authLoading ? <div className="mt-6 grid gap-4"><div className="h-48 animate-pulse rounded-2xl bg-[#250C14]" /><div className="h-48 animate-pulse rounded-2xl bg-[#250C14]" /></div> : filtered.length ? <div className="mt-6 grid gap-4">{filtered.slice(0, visible).map(item => <article key={item.id} className={`${card} p-5`}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-[#9F8189]">{item.id.slice(0, 8)}</p><h2 className="mt-2 text-lg font-semibold">{item.title}</h2><Link href={`/creators/${item.creator_id}`} className="mt-1 block text-sm text-[#D66A84]">with {item.creatorName}</Link></div><span className="rounded-full bg-[#3A101C] px-3 py-1 text-xs capitalize text-[#E7A5B5]">{item.status}</span></div><div className="mt-5 flex flex-wrap gap-4 text-sm text-[#C7A7B0]"><span>₹{Number(item.budget).toLocaleString('en-IN')}</span><span className="inline-flex items-center gap-1"><CalendarDays className="size-4" />Created {new Date(item.created_at).toLocaleDateString()}</span>{item.start_date && <span>Started {new Date(item.start_date).toLocaleDateString()}</span>}</div><div className="mt-5 border-t border-[#3A101C] pt-4">{item.review ? <div><p className="text-[#D66A84]">{'★'.repeat(item.review.rating)}<span className="text-[#54202F]">{'★'.repeat(5 - item.review.rating)}</span></p>{item.review.comment && <p className="mt-2 text-sm text-[#C7A7B0]">{item.review.comment}</p>}</div> : item.status === 'completed' ? <Link href={`/projects/${item.id}?review=1`} className="text-sm text-[#D66A84]">Leave a review</Link> : <p className="text-sm text-[#9F8189]">No review for this cancelled project.</p>}</div><div className="mt-5 flex flex-wrap gap-2"><Link href={`/projects/${item.id}`} className={button}>View details</Link><Link href={`/booking/${item.creator_id}?title=${encodeURIComponent(item.title)}`} className="rounded-xl border border-[#6A2636] px-4 py-2.5 text-sm">Book again</Link><Link href={`/chat?creator=${item.creator_id}&project=${item.id}`} aria-label="Message creator" className="inline-flex items-center justify-center rounded-xl border border-[#6A2636] px-3"><MessageCircle className="size-4" /></Link></div></article>)}</div> : <div className={`${card} mt-6 p-12 text-center`}><h2 className="text-xl font-semibold">No completed work yet</h2><p className="mt-2 text-sm text-[#9F8189]">Projects you finish with creators will show up here.</p><Link href="/find-creators" className={`${button} mt-6`}>Find creators</Link></div>}{visible < filtered.length && <button onClick={() => setVisible(value => value + 10)} className="mx-auto mt-6 block rounded-xl border border-[#6A2636] px-5 py-3 text-sm">Load more</button>}</Layout>
}
